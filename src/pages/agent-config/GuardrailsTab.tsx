import React, { useState } from "react";
import { updateGuardrails } from "../../js/api.ts";
import type { Guardrails } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import type { AgentTabProps } from "./types.ts";

export default function GuardrailsTab({ agent, onAgentUpdated }: AgentTabProps) {
  const showToast = useToast();
  const gr = agent.guardrails;
  const [maxTokens, setMaxTokens] = useState<string>(String(gr?.max_tokens_per_response ?? 2048));
  const [rateLimit, setRateLimit] = useState<string>(String(gr?.rate_limit_per_minute ?? 60));
  const [filterLevel, setFilterLevel] = useState<Guardrails["content_filter_level"]>(
    gr?.content_filter_level || "medium",
  );
  const [topics, setTopics] = useState(gr?.restricted_topics?.join(", ") ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateGuardrails(agent.id, {
        max_tokens_per_response: parseInt(maxTokens, 10),
        rate_limit_per_minute: parseInt(rateLimit, 10),
        content_filter_level: filterLevel,
        restricted_topics: topics
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      });
      onAgentUpdated(updated);
      showToast("Guardrails saved.");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return (
    <div id="tab-guardrails" className="tab-panel active">
      <form className="config-form" onSubmit={handleSave} autoComplete="off">
        <div className="form-row">
          <div className="form-group">
            <label>Max Tokens Per Response (1 – 32768)</label>
            <input
              type="number"
              min={1}
              max={32768}
              required
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Rate Limit Per Minute (1 – 1000)</label>
            <input
              type="number"
              min={1}
              max={1000}
              required
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Content Filter Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as Guardrails["content_filter_level"])}
            >
              <option value="off">Off</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group form-group-wide">
            <label>Restricted Topics (comma-separated)</label>
            <textarea
              placeholder="violence, adult content"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Guardrails
          </button>
        </div>
      </form>
    </div>
  );
}
