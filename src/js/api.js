const BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("symphony_token") || "dev-token";
}

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Agents
export const getAgents = (skip = 0, limit = 20) =>
  apiFetch(`/api/v1/agents?skip=${skip}&limit=${limit}`);
export const createAgent = (data) =>
  apiFetch("/api/v1/agents", { method: "POST", body: JSON.stringify(data) });
export const updateAgent = (id, data) =>
  apiFetch(`/api/v1/agents/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAgent = (id) =>
  apiFetch(`/api/v1/agents/${id}`, { method: "DELETE" });

// Workflows
export const getWorkflows = (skip = 0, limit = 20) =>
  apiFetch(`/api/v1/workflows?skip=${skip}&limit=${limit}`);
export const createWorkflow = (data) =>
  apiFetch("/api/v1/workflows", { method: "POST", body: JSON.stringify(data) });
export const updateWorkflow = (id, data) =>
  apiFetch(`/api/v1/workflows/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteWorkflow = (id) =>
  apiFetch(`/api/v1/workflows/${id}`, { method: "DELETE" });

// Messages
export const getMessages = ({ session_id, agent_id, skip = 0, limit = 20 } = {}) => {
  const p = new URLSearchParams({ skip, limit });
  if (session_id) p.set("session_id", session_id);
  if (agent_id) p.set("agent_id", agent_id);
  return apiFetch(`/api/v1/messages?${p}`);
};
export const createMessage = (data) =>
  apiFetch("/api/v1/messages", { method: "POST", body: JSON.stringify(data) });
export const deleteMessage = (id) =>
  apiFetch(`/api/v1/messages/${id}`, { method: "DELETE" });

// Logs
export const getLogs = ({ agent_id, workflow_id, level, skip = 0, limit = 20 } = {}) => {
  const p = new URLSearchParams({ skip, limit });
  if (agent_id) p.set("agent_id", agent_id);
  if (workflow_id) p.set("workflow_id", workflow_id);
  if (level) p.set("level", level);
  return apiFetch(`/api/v1/logs?${p}`);
};
export const createLog = (data) =>
  apiFetch("/api/v1/logs", { method: "POST", body: JSON.stringify(data) });

// Agent Memory
export const getAgentMemory = (agentId, skip = 0, limit = 20) =>
  apiFetch(`/api/v1/agents/${agentId}/memory?skip=${skip}&limit=${limit}`);
export const upsertMemory = (agentId, data) =>
  apiFetch(`/api/v1/agents/${agentId}/memory`, { method: "POST", body: JSON.stringify(data) });
export const deleteMemory = (agentId, key) =>
  apiFetch(`/api/v1/agents/${agentId}/memory/${encodeURIComponent(key)}`, { method: "DELETE" });