import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getWorkflow, getToolParams, getAgents, updateWorkflow } from "../js/api.ts";
import type { Workflow, ToolParam, Agent } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import { AGENT_DROPDOWN_LIMIT } from "../config.ts";

export default function WorkflowConfig() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const showToast = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, ToolParam[]>>({});
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [toolConfig, setToolConfig] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workflowId) return;
    Promise.all([
      getWorkflow(workflowId),
      getToolParams(),
      getAgents(0, AGENT_DROPDOWN_LIMIT),
    ])
      .then(([wf, params, agentsData]) => {
        setWorkflow(wf);
        setToolParams(params);
        setAgentsList(agentsData.items);
        setToolConfig(wf.tool_config ?? {});
      })
      .catch((e) => showToast((e as Error).message, "error"));
  }, [workflowId, showToast]);

  function handleChange(toolName: string, paramName: string, value: string) {
    setToolConfig((prev) => ({
      ...prev,
      [toolName]: { ...(prev[toolName] ?? {}), [paramName]: value },
    }));
  }

  async function handleSave() {
    if (!workflowId) return;
    setSaving(true);
    try {
      await updateWorkflow(workflowId, { tool_config: toolConfig });
      showToast("Tool config saved.");
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!workflow) {
    return (
      <main className="page">
        <div className="empty-state">Loading…</div>
      </main>
    );
  }

  const nodes = workflow.graph_definition?.nodes ?? [];

  // Collect pipeline tools (type="tool")
  const pipelineToolNames = nodes
    .filter((n) => n.type === "tool" && n.tool_name)
    .map((n) => n.tool_name as string)
    .filter((name, idx, arr) => arr.indexOf(name) === idx);

  // Collect LLM tools from agent nodes
  const agentNodeIds = nodes
    .filter((n) => n.type === "agent" && n.agent_id)
    .map((n) => n.agent_id as string);
  const llmToolNames = agentNodeIds
    .flatMap((id) => agentsList.find((a) => a.id === id)?.tools ?? [])
    .filter((name, idx, arr) => arr.indexOf(name) === idx);

  const hasPipelineTools = pipelineToolNames.length > 0;
  const hasLlmTools = llmToolNames.length > 0;

  function renderToolBlock(toolName: string, badge: "pipeline" | "llm") {
    const params = toolParams[toolName] ?? [];
    if (!params.length) return null;
    return (
      <div className="wfc-tool-block" key={toolName}>
        <div className="wfc-tool-header">
          <span className="wfc-tool-name">{toolName}</span>
          <span className={`wfc-tool-badge wfc-tool-badge-${badge}`}>
            {badge === "pipeline" ? "pipeline" : "llm"}
          </span>
        </div>
        <div className="wfc-params-grid">
          {params.map((p) => (
            <div className="wfc-param-row" key={p.name}>
              <span className="wfc-param-label">{p.label}</span>
              <input
                className="wfc-param-input"
                type="text"
                placeholder={p.name}
                value={(toolConfig[toolName] ?? {})[p.name] ?? ""}
                onChange={(e) => handleChange(toolName, p.name, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Workflow Config: {workflow.name}</h1>
        <Link to="/config" className="btn btn-secondary btn-sm">
          ← Back to Config
        </Link>
      </div>

      <div className="card">
        {!hasPipelineTools && !hasLlmTools && (
          <p className="config-panel-empty">
            No configurable tools found in this workflow's graph.
          </p>
        )}

        {hasPipelineTools && (
          <div className="wfc-section">
            <p className="wfc-section-title">Pipeline Tools</p>
            {pipelineToolNames.map((name) => renderToolBlock(name, "pipeline"))}
          </div>
        )}

        {hasLlmTools && (
          <div className="wfc-section">
            <p className="wfc-section-title">LLM Tools</p>
            {llmToolNames.map((name) => renderToolBlock(name, "llm"))}
          </div>
        )}

        <div className="wfc-save-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </main>
  );
}
