import { useState, useEffect } from "react";
import { getAgents, getAgent } from "../js/api.ts";
import type { Agent } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import { AGENT_DROPDOWN_LIMIT } from "../config.ts";
import MemoryTab from "./agent-config/MemoryTab.tsx";
import SchedulesTab from "./agent-config/SchedulesTab.tsx";
import SkillsTab from "./agent-config/SkillsTab.tsx";
import InteractionRulesTab from "./agent-config/InteractionRulesTab.tsx";
import GuardrailsTab from "./agent-config/GuardrailsTab.tsx";

type ConfigTab = "memory" | "schedules" | "skills" | "interaction" | "guardrails";

const TABS: ConfigTab[] = ["memory", "schedules", "skills", "interaction", "guardrails"];
const TAB_LABELS: Record<ConfigTab, string> = {
  memory: "Memory",
  schedules: "Schedules",
  skills: "Skills",
  interaction: "Interaction Rules",
  guardrails: "Guardrails",
};

export default function AgentConfig() {
  const showToast = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<ConfigTab>("memory");

  useEffect(() => {
    getAgents(0, AGENT_DROPDOWN_LIMIT)
      .then((data) => setAgents(data.items))
      .catch((e) => showToast((e as Error).message, "error"));
  }, [showToast]);

  useEffect(() => {
    if (!agentId) {
      setAgent(null);
      return;
    }
    getAgent(agentId)
      .then(setAgent)
      .catch((e) => showToast((e as Error).message, "error"));
  }, [agentId, showToast]);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Agent Configuration</h1>
      </div>

      <div className="card card-spaced">
        <div className="filter-bar">
          <label className="filter-label">Select Agent:</label>
          <select
            className="select-wide"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="">-- Choose an agent --</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {agent && (
        <div className="card">
          <div className="tab-bar" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? " active" : ""}`}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {activeTab === "memory" && <MemoryTab agentId={agent.id} />}
          {activeTab === "schedules" && <SchedulesTab agentId={agent.id} />}
          {activeTab === "skills" && <SkillsTab agent={agent} onAgentUpdated={setAgent} />}
          {activeTab === "interaction" && (
            <InteractionRulesTab agent={agent} onAgentUpdated={setAgent} />
          )}
          {activeTab === "guardrails" && <GuardrailsTab agent={agent} onAgentUpdated={setAgent} />}
        </div>
      )}
    </main>
  );
}
