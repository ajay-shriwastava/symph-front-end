import type { Agent, GraphNode, GraphEdge, ToolParam } from "../../js/api.ts";

export const PIPELINE_TOOLS = [
  "csv_scanner",
  "data_quality",
  "db_ingestor",
  "data_profiler",
  "job_stats_collector",
  "report_publisher",
  "portfolio_impact_analyzer",
  "product_universe_filter",
];

interface NodeConfigPanelProps {
  node: GraphNode;
  agentsList: Agent[];
  onUpdate: (patch: Partial<GraphNode>) => void;
  onDelete: () => void;
  toolConfig: Record<string, Record<string, string>>;
  onUpdateToolConfig: (toolName: string, paramName: string, value: string) => void;
  toolParams: Record<string, ToolParam[]>;
}

export function NodeConfigPanel({
  node,
  agentsList,
  onUpdate,
  onDelete,
  toolConfig,
  onUpdateToolConfig,
  toolParams,
}: NodeConfigPanelProps) {
  return (
    <>
      <div className="config-field">
        <label>Label</label>
        <input
          type="text"
          value={node.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>

      {node.type === "agent" && (
        <>
          <div className="config-field">
            <label>Agent</label>
            <select
              value={node.agent_id || ""}
              onChange={(e) => {
                const id = e.target.value || undefined;
                const patch: Partial<GraphNode> = { agent_id: id };
                if (id) {
                  const a = agentsList.find((ag) => ag.id === id);
                  if (a && (!node.label || node.label === "Agent")) patch.label = a.name;
                }
                onUpdate(patch);
              }}
            >
              <option value="">— select agent —</option>
              {agentsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          {/* LLM tool params for the agent's tools */}
          {node.agent_id && (() => {
            const agentObj = agentsList.find((a) => a.id === node.agent_id);
            const agentTools = agentObj?.tools ?? [];
            const rows = agentTools.flatMap((toolName) =>
              (toolParams[toolName] ?? []).map((p) => ({ toolName, param: p }))
            );
            if (!rows.length) return null;
            return (
              <div className="config-tool-params">
                <div className="config-tool-params-header">LLM Tool Config</div>
                {rows.map(({ toolName, param }) => (
                  <div className="config-field" key={`${toolName}.${param.name}`}>
                    <label>{toolName} › {param.label}</label>
                    <input
                      type="text"
                      placeholder={param.name}
                      value={(toolConfig[toolName] ?? {})[param.name] ?? ""}
                      onChange={(e) => onUpdateToolConfig(toolName, param.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {node.type === "tool" && (
        <>
          <div className="config-field">
            <label>Pipeline Tool</label>
            <select
              value={node.tool_name || ""}
              onChange={(e) => {
                const val = e.target.value || undefined;
                const patch: Partial<GraphNode> = { tool_name: val };
                if (val && (!node.label || node.label === "Tool")) patch.label = val;
                onUpdate(patch);
              }}
            >
              <option value="">— select tool —</option>
              {PIPELINE_TOOLS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {/* Pipeline tool params */}
          {node.tool_name && (toolParams[node.tool_name] ?? []).map((p) => (
            <div className="config-field" key={p.name}>
              <label>{p.label}</label>
              <input
                type="text"
                placeholder={p.name}
                value={(toolConfig[node.tool_name!] ?? {})[p.name] ?? ""}
                onChange={(e) => onUpdateToolConfig(node.tool_name!, p.name, e.target.value)}
              />
            </div>
          ))}
        </>
      )}

      {node.type === "human_review" && (
        <div className="config-field">
          <label>Review prompt</label>
          <textarea
            rows={3}
            placeholder="Please review the output above and provide feedback or approval to continue."
            value={node.prompt || ""}
            onChange={(e) => onUpdate({ prompt: e.target.value })}
          />
        </div>
      )}

      {node.type === "condition" && (
        <>
          <div className="config-field">
            <label>True label</label>
            <input
              type="text"
              value={node.true_label || "Yes"}
              onChange={(e) => onUpdate({ true_label: e.target.value })}
            />
          </div>
          <div className="config-field">
            <label>False label</label>
            <input
              type="text"
              value={node.false_label || "No"}
              onChange={(e) => onUpdate({ false_label: e.target.value })}
            />
          </div>
        </>
      )}

      <button className="btn btn-danger btn-sm config-delete-btn" onClick={onDelete}>
        Delete Node
      </button>
    </>
  );
}

export function EdgeConfigPanel({ edge, onDelete }: { edge: GraphEdge; onDelete: () => void }) {
  return (
    <>
      <div className="config-field">
        <label>Edge</label>
        <span className="edge-config-meta">
          {edge.from} → {edge.to}
          {edge.branch ? ` (${edge.branch})` : ""}
        </span>
      </div>
      <button className="btn btn-danger btn-sm config-delete-btn" onClick={onDelete}>
        Delete Edge
      </button>
    </>
  );
}
