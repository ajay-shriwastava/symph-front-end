import { useState, type FormEvent } from "react";
import { updateAgent } from "../../js/api.ts";
import type { Agent, AgentCreatePayload } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { MODEL_OPTIONS, CHANNELS, CHANNEL_LABELS } from "../../config.ts";

interface Props {
  agent: Agent;
  onAgentUpdated: (agent: Agent) => void;
}

interface FormState {
  name: string;
  model: string;
  description: string;
  system_prompt: string;
  tools: string;
  channels: string[];
  memory_enabled: boolean;
}

export default function GeneralTab({ agent, onAgentUpdated }: Props) {
  const showToast = useToast();
  const [form, setForm] = useState<FormState>({
    name: agent.name,
    model: agent.model,
    description: agent.description || "",
    system_prompt: agent.system_prompt || "",
    tools: agent.tools.join(", "),
    channels: agent.channels,
    memory_enabled: agent.memory_enabled,
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter((c) => c !== ch)
        : [...f.channels, ch],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
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
      const updated = await updateAgent(agent.id, payload);
      onAgentUpdated(updated);
      showToast("Agent updated.");
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="tab-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          required
          maxLength={255}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>
          Model{" "}
          <span className="field-hint" title="The LLM model ID to use for this agent." />
        </label>
        <input
          type="text"
          list="model-options-general"
          maxLength={100}
          placeholder="claude-sonnet-4-6"
          value={form.model}
          onChange={(e) => set("model", e.target.value)}
        />
        <datalist id="model-options-general">
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
          rows={10}
          placeholder="You are a helpful assistant..."
          value={form.system_prompt}
          onChange={(e) => set("system_prompt", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>
          LLM Tools{" "}
          <span
            className="field-hint"
            title="Comma-separated tool names the agent autonomously decides to call during inference (e.g. scan_csv, publish_report)."
          />
        </label>
        <input
          type="text"
          placeholder="scan_csv, publish_report"
          value={form.tools}
          onChange={(e) => set("tools", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>
          Channels{" "}
          <span
            className="field-hint"
            title="Each active channel auto-injects its corresponding tool as an LLM Tool the agent can call (e.g. email → send_email, telegram → send_telegram)."
          />
        </label>
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
          id="g-memory"
          checked={form.memory_enabled}
          onChange={(e) => set("memory_enabled", e.target.checked)}
        />
        <label htmlFor="g-memory">Memory Enabled</label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
