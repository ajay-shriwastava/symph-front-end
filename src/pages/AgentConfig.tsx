import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAgents, getAgent } from "../js/api.ts";
import type { Agent } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import { AGENT_DROPDOWN_LIMIT } from "../config.ts";
import GeneralTab from "./agent-config/GeneralTab.tsx";
import MemoryTab from "./agent-config/MemoryTab.tsx";
import SchedulesTab from "./agent-config/SchedulesTab.tsx";
import SkillsTab from "./agent-config/SkillsTab.tsx";
import InteractionRulesTab from "./agent-config/InteractionRulesTab.tsx";
import GuardrailsTab from "./agent-config/GuardrailsTab.tsx";

type ConfigTab = "general" | "memory" | "skills" | "interaction" | "guardrails" | "schedules";

const TABS: ConfigTab[] = ["general", "memory", "skills", "interaction", "guardrails", "schedules"];
const TAB_LABELS: Record<ConfigTab, string> = {
  general: "General",
  memory: "Memory",
  skills: "Skills",
  interaction: "Interaction Rules",
  guardrails: "Guardrails",
  schedules: "Schedules",
};

export default function AgentConfig() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const showToast = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<ConfigTab>("general");

  // Landing: load agent list for the selector
  useEffect(() => {
    if (agentId) return;
    getAgents(0, AGENT_DROPDOWN_LIMIT)
      .then((data) => setAgents(data.items))
      .catch((e) => showToast((e as Error).message, "error"));
  }, [agentId, showToast]);

  // Config page: load the selected agent
  useEffect(() => {
    if (!agentId) {
      setAgent(null);
      return;
    }
    getAgent(agentId)
      .then(setAgent)
      .catch((e) => showToast((e as Error).message, "error"));
  }, [agentId, showToast]);

  // ── Landing: no agent selected ──────────────────────────────────────────────
  if (!agentId) {
    return (
      <main className="page">
        <div className="page-header">
          <h1 className="page-title">Configuration</h1>
        </div>
        <div className="card card-spaced">
          <div className="filter-bar">
            <label className="filter-label">Select Agent:</label>
            <select
              className="select-wide"
              value=""
              onChange={(e) => e.target.value && navigate(`/config/agents/${e.target.value}`)}
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
      </main>
    );
  }

  // ── Agent config ────────────────────────────────────────────────────────────
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">{agent?.name ?? "Agent Configuration"}</h1>
        <Link to="/agents" className="btn btn-secondary btn-sm">
          ← Back to Agents
        </Link>
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

          {activeTab === "general" && (
            <GeneralTab agent={agent} onAgentUpdated={setAgent} />
          )}
          {activeTab === "memory" && <MemoryTab agentId={agent.id} />}
          {activeTab === "schedules" && <SchedulesTab agentId={agent.id} />}
          {activeTab === "skills" && (
            <SkillsTab agent={agent} onAgentUpdated={setAgent} />
          )}
          {activeTab === "interaction" && (
            <InteractionRulesTab agent={agent} onAgentUpdated={setAgent} />
          )}
          {activeTab === "guardrails" && (
            <GuardrailsTab agent={agent} onAgentUpdated={setAgent} />
          )}
        </div>
      )}
    </main>
  );
}
