import React, { useState } from "react";
import Pagination from "../components/Pagination.tsx";
import LoadingRows from "../components/LoadingRows.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { useApiList } from "../hooks/useApiList.ts";
import { getMcpAuditLog, getMcpTools, McpAuditLogEntry, McpToolInfo } from "../js/api.ts";
import { truncate } from "../utils/truncate.ts";

// Derive the MCP endpoint URL relative to the current window origin.
function mcpEndpointUrl(): string {
  const origin = window.location.origin.replace(":5173", ":8000");
  return `${origin}/mcp`;
}

function buildClaudeDesktopSnippet(endpoint: string): string {
  return JSON.stringify(
    {
      symphony: {
        url: endpoint,
        headers: { "X-MCP-API-Key": "<your-key>" },
      },
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------
// Server Info card
// ---------------------------------------------------------------------------
function ServerInfoCard() {
  const { showToast } = useToast();
  const endpoint = mcpEndpointUrl();
  const snippet = buildClaudeDesktopSnippet(endpoint);

  function copySnippet() {
    navigator.clipboard
      .writeText(snippet)
      .then(() => showToast("Copied to clipboard"))
      .catch(() => showToast("Copy failed — check clipboard permissions"));
  }

  return (
    <section className="card" style={{ marginBottom: "1.5rem" }}>
      <h2 className="card-title">Server Info</h2>
      <table className="data-table" style={{ width: "auto", minWidth: "420px" }}>
        <tbody>
          <tr>
            <td><strong>Endpoint</strong></td>
            <td><code>{endpoint}</code></td>
          </tr>
          <tr>
            <td><strong>Transport</strong></td>
            <td>Streamable HTTP (POST)</td>
          </tr>
          <tr>
            <td><strong>Auth</strong></td>
            <td><code>X-MCP-API-Key</code> header</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <strong>Claude Desktop config</strong>
          <button className="btn btn-sm" onClick={copySnippet}>
            <i className="ti ti-copy" /> Copy
          </button>
        </div>
        <pre
          style={{
            background: "var(--surface-2, #f4f4f5)",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            fontSize: "0.78rem",
            overflowX: "auto",
            margin: 0,
          }}
        >
          {snippet}
        </pre>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Available Tools table
// ---------------------------------------------------------------------------
function ToolsSection() {
  const [tools, setTools] = React.useState<McpToolInfo[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { showToast } = useToast();

  React.useEffect(() => {
    getMcpTools()
      .then(setTools)
      .catch((err: Error) => showToast(err.message))
      .finally(() => setLoading(false));
  }, []);

  const memoryTools = tools?.filter((t) => t.category === "memory") ?? [];
  const knowledgeTools = tools?.filter((t) => t.category === "knowledge") ?? [];

  return (
    <section className="card" style={{ marginBottom: "1.5rem" }}>
      <h2 className="card-title">Available Tools</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Tool Name</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRows cols={3} rows={8} />
          ) : (
            <>
              {memoryTools.map((t) => (
                <tr key={t.name}>
                  <td><code>{t.name}</code></td>
                  <td><span className="badge badge-blue">memory</span></td>
                  <td>{t.description}</td>
                </tr>
              ))}
              {knowledgeTools.map((t) => (
                <tr key={t.name}>
                  <td><code>{t.name}</code></td>
                  <td><span className="badge badge-green">knowledge</span></td>
                  <td>{t.description}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Audit Log table
// ---------------------------------------------------------------------------
const AUDIT_PAGE_SIZE = 50;

function AuditLogSection() {
  const [callerFilter, setCallerFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const fetcher = React.useCallback(
    (skip: number, limit: number) =>
      getMcpAuditLog(skip, limit, activeFilter || undefined),
    [activeFilter],
  );

  const { items, total, skip, loading, setSkip } = useApiList<McpAuditLogEntry>(
    fetcher,
    AUDIT_PAGE_SIZE,
  );

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    setActiveFilter(callerFilter.trim());
    setSkip(0);
  }

  function clearFilter() {
    setCallerFilter("");
    setActiveFilter("");
    setSkip(0);
  }

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h2 className="card-title" style={{ margin: 0 }}>Audit Log</h2>
        <form onSubmit={applyFilter} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            className="input"
            placeholder="Filter by caller ID…"
            value={callerFilter}
            onChange={(e) => setCallerFilter(e.target.value)}
            style={{ minWidth: "220px" }}
          />
          <button className="btn btn-sm" type="submit">
            <i className="ti ti-filter" /> Filter
          </button>
          {activeFilter && (
            <button className="btn btn-sm btn-ghost" type="button" onClick={clearFilter}>
              Clear
            </button>
          )}
        </form>
        <span style={{ marginLeft: "auto", color: "var(--text-2, #666)", fontSize: "0.85rem" }}>
          {total} total entries
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Caller</th>
            <th>Tool</th>
            <th>Agent ID</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRows cols={5} rows={10} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "var(--text-2, #888)" }}>
                No audit log entries
              </td>
            </tr>
          ) : (
            items.map((entry) => (
              <tr key={entry.id}>
                <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td>
                  <code style={{ fontSize: "0.82rem" }}>{entry.caller_id}</code>
                </td>
                <td>
                  <code style={{ fontSize: "0.82rem" }}>{entry.tool_name}</code>
                </td>
                <td style={{ fontSize: "0.82rem", color: "var(--text-2, #888)" }}>
                  {entry.agent_id ? truncate(entry.agent_id, 16) : "—"}
                </td>
                <td style={{ fontSize: "0.82rem" }}>
                  {entry.result_summary ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination skip={skip} limit={AUDIT_PAGE_SIZE} total={total} onSkipChange={setSkip} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function McpServer() {
  return (
    <main className="page">
      <h1 className="page-title">MCP Server</h1>
      <ServerInfoCard />
      <ToolsSection />
      <AuditLogSection />
    </main>
  );
}