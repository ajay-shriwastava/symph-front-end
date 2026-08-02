import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAgents, createAgent, deleteAgent } from "../js/api.ts";
import type { Agent, AgentCreatePayload } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import Pagination from "../components/Pagination.tsx";
import LoadingRows from "../components/LoadingRows.tsx";
import { useApiList } from "../hooks/useApiList.ts";
import { PAGE_SIZE, MODEL_OPTIONS, CHANNELS, CHANNEL_LABELS } from "../config.ts";

// ── Form state (tools stored as comma string for editing) ────────────────────
interface AgentFormState {
  name: string;
  model: string;
  description: string;
  system_prompt: string;
  tools: string;
  channels: string[];
  memory_enabled: boolean;
}

// ── Agent form ───────────────────────────────────────────────────────────────
interface AgentFormProps {
  agent: Agent | null;
  onSave: (payload: AgentCreatePayload) => Promise<void>;
  onCancel: () => void;
}

function AgentForm({ agent, onSave, onCancel }: AgentFormProps) {
  const [form, setForm] = useState<AgentFormState>({
    name: agent?.name || "",
    model: agent?.model || "claude-sonnet-4-6",
    description: agent?.description || "",
    system_prompt: agent?.system_prompt || "",
    tools: (agent?.tools || []).join(", "),
    channels: agent?.channels || [],
    memory_enabled: agent?.memory_enabled || false,
  });

  function set<K extends keyof AgentFormState>(key: K, val: AgentFormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: AgentCreatePayload = {
      name: form.name.trim(),
      model: form.model.trim() || "claude-sonnet-4-6",
      description: form.description.trim() || null,
      system_prompt: form.system_prompt.trim() || null,
      tools: form.tools
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      channels: form.channels,
      memory_enabled: form.memory_enabled,
    };
    await onSave(payload);
  }

  return (
    <form className="inline-form visible" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          required
          maxLength={255}
          placeholder="My Agent"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>
          Model <span className="field-hint" title="The LLM that powers this agent." />
        </label>
        <input
          type="text"
          list="model-options"
          maxLength={100}
          placeholder="claude-sonnet-4-6"
          value={form.model}
          onChange={(e) => set("model", e.target.value)}
        />
        <datalist id="model-options">
          {MODEL_OPTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
      <div className="form-group">
        <label>
          Description{" "}
          <span
            className="field-hint"
            title="Human-facing summary of what this agent does and when to use it."
          />
        </label>
        <textarea
          placeholder="What does this agent do and when should it be used?"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>
          System Prompt{" "}
          <span
            className="field-hint"
            title="Full runtime instructions sent to the LLM at the start of every conversation."
          />
        </label>
        <textarea
          placeholder="You are a helpful assistant..."
          value={form.system_prompt}
          onChange={(e) => set("system_prompt", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>
          Tools{" "}
          <span className="field-hint" title="Comma-separated list of tools this agent can use." />
        </label>
        <input
          type="text"
          placeholder="web_search, code_exec, send_email"
          value={form.tools}
          onChange={(e) => set("tools", e.target.value)}
        />
      </div>
      <div className="form-group form-group-full">
        <label>Channels</label>
        <div className="channel-options">
          {CHANNELS.map((ch) => (
            <label key={ch} className="channel-option">
              <input
                type="checkbox"
                checked={form.channels.includes(ch)}
                onChange={() => toggleChannel(ch)}
              />
              {CHANNEL_LABELS[ch]}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="f-memory"
          checked={form.memory_enabled}
          onChange={(e) => set("memory_enabled", e.target.checked)}
        />
        <label htmlFor="f-memory">Memory Enabled</label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {agent ? "Update" : "Create"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Agent row with expandable detail ────────────────────────────────────────
interface AgentRowProps {
  agent: Agent;
  onDelete: (agent: Agent) => void;
}

function AgentRow({ agent, onDelete }: AgentRowProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`agent-row${expanded ? " expanded" : ""}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="agent-name-cell">
          <span className={`row-chevron${expanded ? " open" : ""}`}>▶</span>
          <span>{agent.name}</span>
        </td>
        <td>{agent.model}</td>
        <td>
          {agent.memory_enabled ? (
            <span className="bool-yes">Yes</span>
          ) : (
            <span className="bool-no">No</span>
          )}
        </td>
        <td>{new Date(agent.created_at).toLocaleDateString()}</td>
        <td>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/config/agents/${agent.id}`);
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-sm btn-ml"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent);
            }}
          >
            Delete
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="agent-detail-row visible">
          <td colSpan={5} className="agent-detail-cell">
            <div className="agent-detail-grid">
              {agent.description && <DetailField label="Description" value={agent.description} />}
              {agent.system_prompt && (
                <DetailField label="System Prompt" value={agent.system_prompt} />
              )}
              {agent.tools?.length > 0 && <DetailBadges label="Tools" items={agent.tools} />}
              {agent.channels?.length > 0 && (
                <DetailBadges label="Channels" items={agent.channels} labelMap={CHANNEL_LABELS} />
              )}
              {!agent.description &&
                !agent.system_prompt &&
                !agent.tools?.length &&
                !agent.channels?.length && (
                  <span className="detail-empty">No additional details.</span>
                )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

interface DetailBadgesProps {
  label: string;
  items: string[];
  labelMap?: Record<string, string>;
}

function DetailBadges({ label, items, labelMap }: DetailBadgesProps) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-badges">
        {items.map((item) => (
          <span key={item} className="badge badge-purple">
            {labelMap ? labelMap[item] || item : item}
          </span>
        ))}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Agents() {
  const showToast = useToast();
  const [formOpen, setFormOpen] = useState(false);

  const fetcher = useCallback(
    (skip: number, limit: number) => getAgents(skip, limit),
    [],
  );

  const { items: agents, total, skip, loading, setSkip, reload } = useApiList(fetcher, PAGE_SIZE);

  function openNew() {
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
  }

  async function handleSave(payload: AgentCreatePayload) {
    try {
      await createAgent(payload);
      showToast("Agent created.");
      closeForm();
      reload();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  async function handleDelete(agent: Agent) {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    try {
      await deleteAgent(agent.id);
      showToast("Agent deleted.");
      reload();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Agents</h1>
        <button className="btn btn-primary" onClick={openNew}>
          + New Agent
        </button>
      </div>
      <div className="card">
        {formOpen && <AgentForm agent={null} onSave={handleSave} onCancel={closeForm} />}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>Memory</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRows colSpan={5} />
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No agents found.
                  </td>
                </tr>
              ) : (
                agents.map((a) => (
                  <AgentRow key={a.id} agent={a} onDelete={handleDelete} />
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
      </div>
    </main>
  );
}
