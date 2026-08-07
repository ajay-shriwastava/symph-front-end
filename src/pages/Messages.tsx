import React, { useState, useEffect, useCallback } from "react";
import { getMessages, getAgents, deleteMessage } from "../js/api.ts";
import type { Message, MessageFilters, MessageRole } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import Pagination from "../components/Pagination.tsx";
import LoadingRows from "../components/LoadingRows.tsx";
import { useApiList } from "../hooks/useApiList.ts";
import { truncate } from "../utils/truncate.ts";
import { PAGE_SIZE, AGENT_DROPDOWN_LIMIT } from "../config.ts";

const ROLE_BADGE: Record<MessageRole, string> = {
  user: "badge-purple",
  assistant: "badge-teal",
  system: "badge-grey",
  tool: "badge-amber",
  agent: "badge-blue",
};

const DEST_BADGE: Record<string, string> = {
  agent: "badge-blue",
  report: "badge-green",
  display: "badge-teal",
  channel: "badge-amber",
  workflow: "badge-purple",
};

// ── All Messages tab ─────────────────────────────────────────────────────────
function AllMessages() {
  const showToast = useToast();
  const [filters, setFilters] = useState<MessageFilters>({});
  const [sessionInput, setSessionInput] = useState("");
  const [agentInput, setAgentInput] = useState("");

  const fetcher = useCallback(
    (skip: number, limit: number) => getMessages({ ...filters, skip, limit }),
    [filters],
  );

  const { items: messages, total, skip, loading, setSkip, reload } = useApiList(fetcher, PAGE_SIZE);

  function applyFilters() {
    const f: MessageFilters = {};
    if (sessionInput.trim()) f.session_id = sessionInput.trim();
    if (agentInput.trim()) f.agent_id = agentInput.trim();
    setFilters(f);
  }

  function clearFilters() {
    setSessionInput("");
    setAgentInput("");
    setFilters({});
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessage(id);
      showToast("Message deleted.");
      reload();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  return (
    <>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Session ID"
          className="filter-input-lg"
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
        />
        <input
          type="text"
          placeholder="Agent ID"
          className="filter-input-lg"
          value={agentInput}
          onChange={(e) => setAgentInput(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={applyFilters}>
          Apply
        </button>
        <button className="btn btn-secondary" onClick={clearFilters}>
          Clear
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Content</th>
              <th>Dest Type</th>
              <th>Dest Ref</th>
              <th>Agent ID</th>
              <th>Session ID</th>
              <th>Created</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows colSpan={8} />
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  No messages found.
                </td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={`badge ${ROLE_BADGE[m.role] || "badge-grey"}`}>{m.role}</span>
                  </td>
                  <td>{truncate(m.content, 80)}</td>
                  <td>
                    {m.destination_type ? (
                      <span className={`badge ${DEST_BADGE[m.destination_type] || "badge-grey"}`}>
                        {m.destination_type}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{m.destination_ref ? truncate(m.destination_ref, 20) : "—"}</td>
                  <td>{m.agent_id ? m.agent_id.slice(0, 8) + "…" : "—"}</td>
                  <td>{m.session_id ? m.session_id.slice(0, 8) + "…" : "—"}</td>
                  <td>{new Date(m.created_at).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        skip={skip}
        limit={PAGE_SIZE}
        total={total}
        onPrev={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
        onNext={() => setSkip((s) => s + PAGE_SIZE)}
      />
    </>
  );
}

// ── Agent Handoffs tab ───────────────────────────────────────────────────────
interface HandoffMessage extends Message {
  agentName: string;
}

function AgentHandoffs() {
  const showToast = useToast();
  const [handoffs, setHandoffs] = useState<HandoffMessage[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [msgData, agentsData] = await Promise.all([
          getMessages({ role: "agent", limit: 50 }),
          getAgents(0, AGENT_DROPDOWN_LIMIT),
        ]);
        const agentNameMap: Record<string, string> = {};
        for (const a of agentsData.items) {
          agentNameMap[a.id] = a.name;
        }
        setHandoffs(
          msgData.items.map((m) => ({
            ...m,
            agentName: (m.agent_id && agentNameMap[m.agent_id]) || m.agent_id?.slice(0, 8) + "…",
          })),
        );
      } catch (e) {
        showToast((e as Error).message, "error");
        setHandoffs([]);
      }
    }
    load();
  }, [showToast]);

  if (handoffs === null) {
    return <div className="empty-state">Loading handoffs...</div>;
  }

  if (handoffs.length === 0) {
    return (
      <div className="empty-state">
        No agent handoffs recorded yet. Run a workflow with linked agents to see handoffs here.
      </div>
    );
  }

  return (
    <div className="handoff-list">
      {handoffs.map((m) => (
        <div key={m.id} className="handoff-card">
          <div className="handoff-header">
            <span className="badge badge-blue">agent</span>
            <strong>{m.agentName}</strong>
            <span className="handoff-meta">
              Run: {m.session_id ? m.session_id.slice(0, 8) + "…" : "—"} &middot;{" "}
              {new Date(m.created_at).toLocaleString()}
            </span>
          </div>
          <div className="handoff-content">{m.content}</div>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
type Tab = "all" | "handoffs";

export default function Messages() {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
      </div>
      <div className="card">
        <div className="tab-bar">
          <button
            className={`tab-btn${activeTab === "all" ? " active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Messages
          </button>
          <button
            className={`tab-btn${activeTab === "handoffs" ? " active" : ""}`}
            onClick={() => setActiveTab("handoffs")}
          >
            Agent Handoffs
          </button>
        </div>
        {activeTab === "all" ? <AllMessages /> : <AgentHandoffs />}
      </div>
    </main>
  );
}
