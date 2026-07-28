import type { Agent, GraphNode, GraphEdge } from "../../js/api.ts";

export const PIPELINE_TOOLS = [
  "csv_scanner",
  "data_quality",
  "db_ingestor",
  "data_profiler",
  "job_stats_collector",
  "report_publisher",
];

interface NodeConfigPanelProps {
  node: GraphNode;
  agentsList: Agent[];
  onUpdate: (patch: Partial<GraphNode>) => void;
  onDelete: () => void;
}

export function NodeConfigPanel({ node, agentsList, onUpdate, onDelete }: NodeConfigPanelProps) {
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
      )}

      {node.type === "tool" && (
        <div className="config-field">
          <label>Tool</label>
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
