import type { Agent } from "../../js/api.ts";

export interface AgentTabProps {
  agent: Agent;
  onAgentUpdated: (agent: Agent) => void;
}
