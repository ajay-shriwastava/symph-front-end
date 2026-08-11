// Set VITE_API_BASE in .env for local dev (e.g. http://localhost:8000).
// Leave empty when nginx proxies /api/ → backend in Docker / production.
const BASE_URL: string = import.meta.env.VITE_API_BASE ?? "";

// Derive WebSocket base: http→ws, https→wss, or same-origin fallback.
function wsBase(): string {
  if (BASE_URL) {
    return BASE_URL.replace(/^http/, "ws");
  }
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}`;
}
export const WS_BASE = wsBase();

// ── Paginated response ──────────────────────────────────────────────────────
export interface Paginated<T> {
  items: T[];
  total: number;
}

// ── Agent ───────────────────────────────────────────────────────────────────
export interface InteractionRules {
  temperature: number;
  max_turns: number;
  response_style: "concise" | "balanced" | "verbose";
  language: string;
}

export interface Guardrails {
  max_tokens_per_response: number;
  rate_limit_per_minute: number;
  content_filter_level: "off" | "low" | "medium" | "high";
  restricted_topics: string[];
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  description: string | null;
  system_prompt: string | null;
  tools: string[];
  channels: string[];
  memory_enabled: boolean;
  interaction_rules: InteractionRules | null;
  guardrails: Guardrails | null;
  message_log_level: "MINIMAL" | "STANDARD" | "VERBOSE" | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCreatePayload {
  name: string;
  model: string;
  description: string | null;
  system_prompt: string | null;
  tools: string[];
  channels: string[];
  memory_enabled: boolean;
  message_log_level?: "MINIMAL" | "STANDARD" | "VERBOSE" | null;
}

// ── Workflow ────────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  type: "start" | "end" | "agent" | "tool" | "condition";
  x: number;
  y: number;
  label: string;
  agent_id?: string;
  tool_name?: string;
  true_label?: string;
  false_label?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  branch?: string;
}

export interface GraphDefinition {
  nodes: GraphNode[];
  edges: GraphEdge[];
  max_loops: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "archived";
  graph_definition: GraphDefinition | null;
  tool_config: Record<string, Record<string, string>>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreatePayload {
  name: string;
  description: string | null;
}

export interface WorkflowUpdatePayload {
  name?: string;
  description?: string | null;
  graph_definition?: GraphDefinition;
  tool_config?: Record<string, Record<string, string>>;
}

export interface ToolParam {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

// ── Workflow Run ────────────────────────────────────────────────────────────
export interface RunUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
  cost_usd?: number;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string | null;
  finished_at: string | null;
  usage: RunUsage | null;
}

// ── Message ─────────────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant" | "system" | "tool" | "agent";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  agent_id: string | null;
  session_id: string | null;
  destination_type: string | null;
  destination_ref: string | null;
  created_at: string;
}

export interface MessageFilters {
  session_id?: string;
  agent_id?: string;
  role?: MessageRole;
  skip?: number;
  limit?: number;
}

// ── Log ─────────────────────────────────────────────────────────────────────
export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  agent_id: string | null;
  workflow_id: string | null;
  created_at: string;
}

export interface LogFilters {
  agent_id?: string;
  workflow_id?: string;
  level?: LogLevel;
  skip?: number;
  limit?: number;
}

// ── Memory ──────────────────────────────────────────────────────────────────
export interface MemoryEntry {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// ── Template ────────────────────────────────────────────────────────────────
export interface Template {
  id: string;
  name: string;
  description: string;
  schedule: string | null;
}

// ── Base fetch ──────────────────────────────────────────────────────────────
import { AUTH_TOKEN_KEY, DEV_TOKEN } from "../config.ts";

function getToken(): string {
  return localStorage.getItem(AUTH_TOKEN_KEY) || DEV_TOKEN;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ── Agents ──────────────────────────────────────────────────────────────────
export const getAgents = (skip = 0, limit = 20): Promise<Paginated<Agent>> =>
  apiFetch(`/api/v1/agents?skip=${skip}&limit=${limit}`);

export const getAgent = (id: string): Promise<Agent> => apiFetch(`/api/v1/agents/${id}`);

export const createAgent = (data: AgentCreatePayload): Promise<Agent> =>
  apiFetch("/api/v1/agents", { method: "POST", body: JSON.stringify(data) });

export const updateAgent = (id: string, data: Partial<AgentCreatePayload>): Promise<Agent> =>
  apiFetch(`/api/v1/agents/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteAgent = (id: string): Promise<null> =>
  apiFetch(`/api/v1/agents/${id}`, { method: "DELETE" });

// ── Workflows ───────────────────────────────────────────────────────────────
export const getWorkflows = (skip = 0, limit = 20): Promise<Paginated<Workflow>> =>
  apiFetch(`/api/v1/workflows?skip=${skip}&limit=${limit}`);

export const getWorkflow = (id: string): Promise<Workflow> =>
  apiFetch(`/api/v1/workflows/${id}`);

export const createWorkflow = (data: WorkflowCreatePayload): Promise<Workflow> =>
  apiFetch("/api/v1/workflows", { method: "POST", body: JSON.stringify(data) });

export const updateWorkflow = (id: string, data: WorkflowUpdatePayload): Promise<Workflow> =>
  apiFetch(`/api/v1/workflows/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteWorkflow = (id: string): Promise<null> =>
  apiFetch(`/api/v1/workflows/${id}`, { method: "DELETE" });

export const getToolParams = (): Promise<Record<string, ToolParam[]>> =>
  apiFetch("/api/v1/tools/params");

// ── Workflow Runs ───────────────────────────────────────────────────────────
export const runWorkflow = (
  id: string,
  input: Record<string, unknown> = {},
): Promise<WorkflowRun> =>
  apiFetch(`/api/v1/workflows/${id}/run`, { method: "POST", body: JSON.stringify({ input }) });

export const getWorkflowRuns = (
  id: string,
  skip = 0,
  limit = 20,
): Promise<Paginated<WorkflowRun>> =>
  apiFetch(`/api/v1/workflows/${id}/runs?skip=${skip}&limit=${limit}`);

export const getWorkflowRun = (workflowId: string, runId: string): Promise<WorkflowRun> =>
  apiFetch(`/api/v1/workflows/${workflowId}/runs/${runId}`);

// ── Messages ────────────────────────────────────────────────────────────────
export const getMessages = (filters: MessageFilters = {}): Promise<Paginated<Message>> => {
  const { session_id, agent_id, role, skip = 0, limit = 20 } = filters;
  const p = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (session_id) p.set("session_id", session_id);
  if (agent_id) p.set("agent_id", agent_id);
  if (role) p.set("role", role);
  return apiFetch(`/api/v1/messages?${p}`);
};

export const createMessage = (data: {
  role: MessageRole;
  content: string;
  agent_id?: string;
  session_id?: string;
}): Promise<Message> =>
  apiFetch("/api/v1/messages", { method: "POST", body: JSON.stringify(data) });

export const deleteMessage = (id: string): Promise<null> =>
  apiFetch(`/api/v1/messages/${id}`, { method: "DELETE" });

// ── Logs ────────────────────────────────────────────────────────────────────
export const getLogs = (filters: LogFilters = {}): Promise<Paginated<LogEntry>> => {
  const { agent_id, workflow_id, level, skip = 0, limit = 20 } = filters;
  const p = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (agent_id) p.set("agent_id", agent_id);
  if (workflow_id) p.set("workflow_id", workflow_id);
  if (level) p.set("level", level);
  return apiFetch(`/api/v1/logs?${p}`);
};

export const createLog = (data: {
  level: LogLevel;
  message: string;
  agent_id?: string;
  workflow_id?: string;
}): Promise<LogEntry> => apiFetch("/api/v1/logs", { method: "POST", body: JSON.stringify(data) });

// ── Agent Memory ────────────────────────────────────────────────────────────
export const getAgentMemory = (
  agentId: string,
  skip = 0,
  limit = 20,
): Promise<Paginated<MemoryEntry>> =>
  apiFetch(`/api/v1/agents/${agentId}/memory?skip=${skip}&limit=${limit}`);

export const upsertMemory = (
  agentId: string,
  data: { key: string; value: string },
): Promise<MemoryEntry> =>
  apiFetch(`/api/v1/agents/${agentId}/memory`, { method: "POST", body: JSON.stringify(data) });

export const deleteMemory = (agentId: string, key: string): Promise<null> =>
  apiFetch(`/api/v1/agents/${agentId}/memory/${encodeURIComponent(key)}`, { method: "DELETE" });

// ── Templates ───────────────────────────────────────────────────────────────
export const getTemplates = (): Promise<Template[]> => apiFetch("/api/v1/templates");

export const instantiateTemplate = (templateId: string): Promise<Workflow> =>
  apiFetch(`/api/v1/templates/${templateId}/instantiate`, { method: "POST" });

// ── Agent Config (interaction rules, guardrails) ─────────────────────────────
export const updateInteractionRules = (
  agentId: string,
  interaction_rules: InteractionRules,
): Promise<Agent> =>
  apiFetch(`/api/v1/agents/${agentId}/interaction-rules`, {
    method: "PUT",
    body: JSON.stringify({ interaction_rules }),
  });

export const updateGuardrails = (agentId: string, guardrails: Guardrails): Promise<Agent> =>
  apiFetch(`/api/v1/agents/${agentId}/guardrails`, {
    method: "PUT",
    body: JSON.stringify({ guardrails }),
  });
