import React, { useState, useEffect, useCallback } from "react";
import {
  getKnowledge,
  ingestKnowledge,
  deleteKnowledge,
  searchKnowledge,
} from "../js/api.ts";
import type { KnowledgeEntry, KnowledgeSearchResult } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import LoadingRows from "../components/LoadingRows.tsx";

// ── Documents tab ─────────────────────────────────────────────────────────────

function Documents() {
  const showToast = useToast();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Ingest form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getKnowledge(0, 100);
      setEntries(data);
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIngesting(true);
    try {
      const chunks = await ingestKnowledge({ title: title.trim(), content: content.trim() });
      showToast(`Ingested "${title.trim()}" — ${chunks.length} chunk(s) stored.`);
      setTitle("");
      setContent("");
      load();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setIngesting(false);
    }
  }

  async function handleDelete(id: string, entryTitle: string) {
    if (!confirm(`Delete all chunks for "${entryTitle}"?`)) return;
    try {
      await deleteKnowledge(id);
      showToast("Entry deleted.");
      load();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  return (
    <>
      {/* Ingest form */}
      <div className="kb-ingest-form">
        <h2 className="kb-section-title">Ingest Document</h2>
        <form onSubmit={handleIngest} className="kb-form">
          <input
            type="text"
            className="input"
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="input kb-textarea"
            placeholder="Paste document content here — it will be chunked and embedded automatically."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
          />
          <div>
            <button type="submit" className="btn btn-primary" disabled={ingesting}>
              {ingesting ? "Ingesting…" : "Ingest"}
            </button>
          </div>
        </form>
      </div>

      {/* Document list */}
      <div className="kb-section-title kb-list-header">
        <h2 className="kb-section-title">Stored Documents</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Content Preview</th>
              <th>Created</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows colSpan={4} />
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  No documents ingested yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr
                    className="kb-row"
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  >
                    <td>
                      <span className="kb-title">{entry.title}</span>
                    </td>
                    <td className="kb-preview">
                      {entry.content.length > 120
                        ? entry.content.slice(0, 120) + "…"
                        : entry.content}
                    </td>
                    <td>{new Date(entry.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id, entry.title);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expanded === entry.id && (
                    <tr className="kb-expanded-row">
                      <td colSpan={4}>
                        <div className="kb-expanded-content">{entry.content}</div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Search tab ────────────────────────────────────────────────────────────────

function Search() {
  const showToast = useToast();
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState<KnowledgeSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await searchKnowledge({ query: query.trim(), top_k: topK });
      setResults(data);
    } catch (e) {
      showToast((e as Error).message, "error");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <h2 className="kb-section-title">Semantic Search</h2>
      <form onSubmit={handleSearch} className="kb-search-bar">
        <input
          type="text"
          className="input kb-search-input"
          placeholder="Enter a query to find relevant chunks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <div className="kb-topk-wrap">
          <label className="kb-topk-label">Top K</label>
          <input
            type="number"
            className="input kb-topk-input"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {results === null ? (
        <div className="empty-state">Run a search to see results.</div>
      ) : results.length === 0 ? (
        <div className="empty-state">No matching chunks found.</div>
      ) : (
        <div className="kb-results">
          {results.map((r) => (
            <div key={r.id} className="kb-result-card">
              <div className="kb-result-header">
                <span className="kb-result-title">{r.title}</span>
                <span className="kb-result-score">
                  relevance: {(r.score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="kb-result-content">{r.content}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "documents" | "search";

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<Tab>("documents");

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Doc Store</h1>
      </div>
      <div className="card">
        <div className="tab-bar">
          <button
            className={`tab-btn${activeTab === "documents" ? " active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            Documents
          </button>
          <button
            className={`tab-btn${activeTab === "search" ? " active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            Search
          </button>
        </div>
        {activeTab === "documents" ? <Documents /> : <Search />}
      </div>
    </main>
  );
}