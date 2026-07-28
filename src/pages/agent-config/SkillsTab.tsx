import React, { useState, useEffect } from "react";
import { updateSkills } from "../../js/api.ts";
import type { Skill } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import type { AgentTabProps } from "./types.ts";

export default function SkillsTab({ agent, onAgentUpdated }: AgentTabProps) {
  const showToast = useToast();
  const [localSkills, setLocalSkills] = useState<Skill[]>([]);
  const [skName, setSkName] = useState("");
  const [skDesc, setSkDesc] = useState("");
  const [skEnabled, setSkEnabled] = useState(true);

  useEffect(() => {
    setLocalSkills((agent.skills || []).map((s) => ({ ...s })));
  }, [agent.id, agent.skills]);

  function addSkill() {
    if (!skName.trim()) {
      showToast("Skill name is required.", "error");
      return;
    }
    setLocalSkills((prev) => [
      ...prev,
      { name: skName.trim(), description: skDesc.trim() || null, enabled: skEnabled },
    ]);
    setSkName("");
    setSkDesc("");
    setSkEnabled(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateSkills(agent.id, localSkills);
      onAgentUpdated(updated);
      showToast("Skills saved.");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return (
    <div id="tab-skills" className="tab-panel active">
      <form className="inline-form visible" onSubmit={handleSave} autoComplete="off">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            maxLength={255}
            placeholder="Web search"
            value={skName}
            onChange={(e) => setSkName(e.target.value)}
          />
        </div>
        <div className="form-group form-group-wide">
          <label>Description</label>
          <input
            type="text"
            placeholder="Optional description"
            value={skDesc}
            onChange={(e) => setSkDesc(e.target.value)}
          />
        </div>
        <div className="form-group checkbox-group form-group-fixed">
          <input
            type="checkbox"
            id="sk-enabled"
            checked={skEnabled}
            onChange={(e) => setSkEnabled(e.target.checked)}
          />
          <label htmlFor="sk-enabled">Enabled</label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={addSkill}>
            Add
          </button>
          <button type="submit" className="btn btn-primary">
            Save Skills
          </button>
        </div>
      </form>
      <div className="skill-list">
        {localSkills.length === 0 ? (
          <div className="empty-state">No skills added.</div>
        ) : (
          localSkills.map((sk, i) => (
            <div key={i} className="skill-row">
              <input
                type="checkbox"
                checked={sk.enabled}
                onChange={(e) =>
                  setLocalSkills((prev) =>
                    prev.map((s, idx) => (idx === i ? { ...s, enabled: e.target.checked } : s)),
                  )
                }
              />
              <span className="skill-name">{sk.name}</span>
              <span className="skill-desc">{sk.description || ""}</span>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setLocalSkills((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
