import React, { useState } from "react";
import { updateInteractionRules } from "../../js/api.ts";
import type { InteractionRules } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import type { AgentTabProps } from "./types.ts";

export default function InteractionRulesTab({ agent, onAgentUpdated }: AgentTabProps) {
  const showToast = useToast();
  const ir = agent.interaction_rules;
  const [temperature, setTemperature] = useState<string>(String(ir?.temperature ?? 0.7));
  const [maxTurns, setMaxTurns] = useState<string>(String(ir?.max_turns ?? 10));
  const [style, setStyle] = useState<InteractionRules["response_style"]>(
    ir?.response_style || "balanced",
  );
  const [language, setLanguage] = useState(ir?.language || "en");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateInteractionRules(agent.id, {
        temperature: parseFloat(temperature),
        max_turns: parseInt(maxTurns, 10),
        response_style: style,
        language: language.trim(),
      });
      onAgentUpdated(updated);
      showToast("Interaction rules saved.");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return (
    <div id="tab-interaction" className="tab-panel active">
      <form className="config-form" onSubmit={handleSave} autoComplete="off">
        <div className="form-row">
          <div className="form-group">
            <label>
              Temperature (0.0 – 2.0){" "}
              <span className="range-value">{parseFloat(temperature).toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Max Turns (1 – 100)</label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={maxTurns}
              onChange={(e) => setMaxTurns(e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Response Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as InteractionRules["response_style"])}
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="verbose">Verbose</option>
            </select>
          </div>
          <div className="form-group">
            <label>Language (code)</label>
            <input
              type="text"
              maxLength={10}
              required
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Interaction Rules
          </button>
        </div>
      </form>
    </div>
  );
}
