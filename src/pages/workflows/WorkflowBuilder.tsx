import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  updateWorkflow,
  runWorkflow,
  getWorkflowRuns,
  getToolParams,
  resumeRun,
  WS_BASE,
} from "../../js/api.ts";
import type {
  Agent,
  Workflow,
  WorkflowRun,
  GraphNode,
  GraphEdge,
  GraphDefinition,
  ToolParam,
} from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { AUTH_TOKEN_KEY, DEV_TOKEN } from "../../config.ts";
import {
  NODE_DIMS,
  nodeGeom,
  portPositions,
  calcEdgePath,
  genId,
} from "./graph-helpers.ts";
import type { Point, RunLogLine, InteractionState } from "./graph-helpers.ts";
import { NodeConfigPanel, EdgeConfigPanel } from "./NodeConfigPanel.tsx";

interface WorkflowBuilderProps {
  workflow: Workflow;
  agentsList: Agent[];
  onClose: () => void;
  onSaved: () => void;
}

export default function WorkflowBuilder({ workflow, agentsList, onClose, onSaved }: WorkflowBuilderProps) {
  const showToast = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const activeWsRef = useRef<WebSocket | null>(null);

  // Graph state
  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    const gd = workflow.graph_definition;
    return gd ? JSON.parse(JSON.stringify(gd.nodes)) : [];
  });
  const [edges, setEdges] = useState<GraphEdge[]>(() => {
    const gd = workflow.graph_definition;
    return gd ? JSON.parse(JSON.stringify(gd.edges)) : [];
  });
  const [maxLoops, setMaxLoops] = useState<string>(() => {
    const gd = workflow.graph_definition;
    return String(gd?.max_loops ?? 20);
  });

  // Tool config state
  const [toolConfig, setToolConfig] = useState<Record<string, Record<string, string>>>(
    () => workflow.tool_config ?? {},
  );
  const [toolParams, setToolParams] = useState<Record<string, ToolParam[]>>({});

  // Selection & transform
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [draftEdge, setDraftEdge] = useState<string | null>(null);

  // Run state
  const [runLog, setRunLog] = useState<RunLogLine[]>([]);
  const [runLogVisible, setRunLogVisible] = useState(true);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [builderStatus, setBuilderStatus] = useState("");

  // HITL state
  const [reviewPending, setReviewPending] = useState<{
    nodeId: string;
    prompt: string;
    context: string;
  } | null>(null);
  const [reviewInput, setReviewInput] = useState("");
  const currentRunIdRef = useRef<string | null>(null);

  // Run log auto-scroll
  const runLogBodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = runLogBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [runLog]);

  // Refs to avoid stale closures in event handlers
  const nodesRef = useRef(nodes);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const interactionRef = useRef<InteractionState>({
    mode: "idle",
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
    panStartX: 0,
    panStartY: 0,
    fromNodeId: null,
    fromBranch: null,
  });

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    panRef.current = pan;
    scaleRef.current = scale;
  }, [pan, scale]);

  const loadRuns = useCallback(async () => {
    try {
      const data = await getWorkflowRuns(workflow.id, 0, 20);
      setRuns(data.items || []);
    } catch {}
  }, [workflow.id]);

  useEffect(() => {
    loadRuns();
    getToolParams().then(setToolParams).catch(() => {});
    return () => {
      if (activeWsRef.current) activeWsRef.current.close();
    };
  }, [loadRuns]);

  // Delete key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        if (selectedNodeId) removeNode(selectedNodeId);
        else if (selectedEdgeId) removeEdge(selectedEdgeId);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectedNodeId, selectedEdgeId]);

  // Global mouseup so drag/pan ends even if mouse leaves SVG
  useEffect(() => {
    function handleGlobalMouseUp(e: MouseEvent) {
      const intr = interactionRef.current;
      if (intr.mode === "idle") return;
      const prevMode = intr.mode;
      interactionRef.current = { ...intr, mode: "idle" };

      if (prevMode === "drawing-edge") {
        setDraftEdge(null);
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.getAttribute("data-port-key") === "in") {
          const toNodeId = el.getAttribute("data-node-id");
          if (toNodeId && toNodeId !== intr.fromNodeId) {
            addEdge(intr.fromNodeId!, toNodeId, intr.fromBranch);
          }
        }
      }
    }
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // ── SVG coordinate helper ────────────────────────────────────────────────
  function toSvgCoords(clientX: number, clientY: number): Point {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panRef.current.x) / scaleRef.current,
      y: (clientY - rect.top - panRef.current.y) / scaleRef.current,
    };
  }

  // ── Mouse handlers ───────────────────────────────────────────────────────
  function handleNodeMouseDown(e: React.MouseEvent, nodeId: string) {
    if (interactionRef.current.mode === "drawing-edge") return;
    e.preventDefault();
    e.stopPropagation();
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;
    const pt = toSvgCoords(e.clientX, e.clientY);
    interactionRef.current = {
      ...interactionRef.current,
      mode: "drag-node",
      nodeId,
      offsetX: pt.x - node.x,
      offsetY: pt.y - node.y,
    };
  }

  function handleNodeClick(e: React.MouseEvent, nodeId: string) {
    if (interactionRef.current.mode !== "idle") return;
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }

  function handlePortMouseDown(e: React.MouseEvent, nodeId: string, branch: string | null) {
    e.preventDefault();
    e.stopPropagation();
    interactionRef.current = {
      ...interactionRef.current,
      mode: "drawing-edge",
      fromNodeId: nodeId,
      fromBranch: branch || null,
    };
    setDraftEdge("");
  }

  function handleEdgeClick(e: React.MouseEvent, edgeId: string) {
    if (interactionRef.current.mode !== "idle") return;
    e.stopPropagation();
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }

  function handleSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (
      (e.target === svgRef.current || (e.target as Element).tagName === "svg") &&
      interactionRef.current.mode === "idle"
    ) {
      interactionRef.current = {
        ...interactionRef.current,
        mode: "panning",
        panStartX: e.clientX - panRef.current.x,
        panStartY: e.clientY - panRef.current.y,
      };
    }
  }

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const intr = interactionRef.current;
    if (intr.mode === "drag-node") {
      const pt = toSvgCoords(e.clientX, e.clientY);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === intr.nodeId ? { ...n, x: pt.x - intr.offsetX, y: pt.y - intr.offsetY } : n,
        ),
      );
    } else if (intr.mode === "panning") {
      const newPan = { x: e.clientX - intr.panStartX, y: e.clientY - intr.panStartY };
      panRef.current = newPan;
      setPan(newPan);
    } else if (intr.mode === "drawing-edge" && intr.fromNodeId) {
      const fromNode = nodesRef.current.find((n) => n.id === intr.fromNodeId);
      if (!fromNode) return;
      const fp_ports = portPositions(fromNode);
      const fp =
        fromNode.type === "condition" && intr.fromBranch
          ? fp_ports[intr.fromBranch] || fp_ports.true
          : fp_ports.out || fp_ports.true;
      if (!fp) return;
      const pt = toSvgCoords(e.clientX, e.clientY);
      const dx = Math.abs(pt.x - fp.x) * 0.5;
      setDraftEdge(
        `M ${fp.x} ${fp.y} C ${fp.x + dx} ${fp.y}, ${pt.x - dx} ${pt.y}, ${pt.x} ${pt.y}`,
      );
    }
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target === svgRef.current || (e.target as Element).tagName === "svg") {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(3, Math.max(0.2, scaleRef.current * delta));
    scaleRef.current = newScale;
    setScale(newScale);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain") as GraphNode["type"];
    if (!type) return;
    const pt = toSvgCoords(e.clientX, e.clientY);
    const dims = NODE_DIMS[type] || NODE_DIMS.agent;
    addNode(type, pt.x - dims.w / 2, pt.y - dims.h / 2);
  }

  // ── Graph mutations ──────────────────────────────────────────────────────
  function addNode(type: GraphNode["type"], x: number, y: number) {
    const LABELS: Record<GraphNode["type"], string> = {
      start: "Start",
      end: "End",
      agent: "Agent",
      condition: "Check",
      tool: "Tool",
      human_review: "Human Review",
    };
    const node: GraphNode = { id: genId(type), type, x, y, label: LABELS[type] || type };
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }

  function addEdge(fromId: string, toId: string, branch: string | null) {
    setEdges((prev) => {
      const dup = prev.find(
        (e) => e.from === fromId && e.to === toId && (e.branch || null) === (branch || null),
      );
      if (dup) return prev;
      const edge: GraphEdge = { id: genId("e"), from: fromId, to: toId };
      if (branch) edge.branch = branch;
      return [...prev, edge];
    });
  }

  function removeNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedNodeId(null);
  }

  function removeEdge(id: string) {
    setEdges((prev) => prev.filter((e) => e.id !== id));
    setSelectedEdgeId(null);
  }

  function updateNode(nodeId: string, patch: Partial<GraphNode>) {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)));
  }

  function handleUpdateToolConfig(toolName: string, paramName: string, value: string) {
    setToolConfig((prev) => ({
      ...prev,
      [toolName]: { ...(prev[toolName] ?? {}), [paramName]: value },
    }));
  }

  // ── Save & Run ───────────────────────────────────────────────────────────
  async function handleSave() {
    const graph_definition: GraphDefinition = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      max_loops: parseInt(maxLoops) || 20,
    };
    try {
      await updateWorkflow(workflow.id, { graph_definition, tool_config: toolConfig });
      setBuilderStatus("Saved");
      setTimeout(() => setBuilderStatus(""), 2000);
      showToast("Workflow saved.");
      onSaved();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  async function handleRun() {
    try {
      const runResp = await runWorkflow(workflow.id, {});
      currentRunIdRef.current = runResp.id;
      setReviewPending(null);
      setReviewInput("");
      setRunLog([{ text: `Run started: ${runResp.id}`, cls: "log-enter" }]);
      openRunWebSocket(workflow.id, runResp.id);
      loadRuns();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  async function handleResumeRun() {
    if (!currentRunIdRef.current) return;
    try {
      await resumeRun(workflow.id, currentRunIdRef.current, reviewInput);
      setRunLog((p) => [...p, { text: "Review submitted — workflow resuming…", cls: "log-complete" }]);
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  function openRunWebSocket(workflowId: string, runId: string) {
    if (activeWsRef.current) {
      activeWsRef.current.close();
      activeWsRef.current = null;
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || DEV_TOKEN;
    const ws = new WebSocket(
      `${WS_BASE}/ws/workflows/${workflowId}/runs/${runId}?token=${token}`,
    );
    activeWsRef.current = ws;

    ws.addEventListener("open", () => {
      setRunLog((p) => [...p, { text: "WebSocket connected.", cls: "log-enter" }]);
    });
    ws.addEventListener("message", (ev) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      const ts = msg.ts ? new Date(msg.ts as string).toLocaleTimeString() : "";
      switch (msg.event) {
        case "node_enter":
          setRunLog((p) => [
            ...p,
            { text: `[${ts}] ENTER  node:${msg.node_id}`, cls: "log-enter" },
          ]);
          break;
        case "node_complete": {
          const u = msg.usage as Record<string, number> | undefined;
          const s = u
            ? `  [↑${u.input_tokens} ↓${u.output_tokens} $${u.cost_usd?.toFixed(4)}]`
            : "";
          setRunLog((p) => [
            ...p,
            { text: `[${ts}] DONE   node:${msg.node_id}${s}`, cls: "log-complete" },
          ]);
          break;
        }
        case "edge_traverse":
          setRunLog((p) => [...p, { text: `[${ts}] EDGE   ${msg.edge_id}`, cls: "log-edge" }]);
          break;
        case "human_review_required":
          setReviewPending({
            nodeId: msg.node_id as string,
            prompt: msg.prompt as string,
            context: msg.context as string,
          });
          setRunLog((p) => [
            ...p,
            { text: `[${ts}] PAUSED  node:${msg.node_id} — awaiting human review`, cls: "log-review" },
          ]);
          loadRuns();
          break;
        case "human_review_completed":
          setReviewPending(null);
          setReviewInput("");
          setRunLog((p) => [
            ...p,
            { text: `[${ts}] RESUMED node:${msg.node_id}`, cls: "log-complete" },
          ]);
          loadRuns();
          break;
        case "run_complete": {
          const u = msg.usage as Record<string, number> | undefined;
          const s = u
            ? ` | Tokens: ${u.total_tokens?.toLocaleString()} | Cost: $${u.estimated_cost_usd?.toFixed(4)}`
            : "";
          setRunLog((p) => [
            ...p,
            { text: `[${ts}] RUN COMPLETE — status:${msg.status}${s}`, cls: "log-done" },
          ]);
          ws.close();
          loadRuns();
          break;
        }
        case "run_error":
          setRunLog((p) => [...p, { text: `[${ts}] ERROR  ${msg.error}`, cls: "log-error" }]);
          ws.close();
          loadRuns();
          break;
      }
    });
    ws.addEventListener("close", () => {
      setRunLog((p) => [...p, { text: "WebSocket closed.", cls: "log-edge" }]);
    });
    ws.addEventListener("error", () => {
      setRunLog((p) => [...p, { text: "WebSocket error.", cls: "log-error" }]);
    });
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="builder-section">
      <div className="page-header builder-section-header">
        <h2 className="page-title builder-section-title">Builder: {workflow.name}</h2>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Close Builder
        </button>
      </div>

      <div className="builder-wrap">
        {/* Toolbar */}
        <div className="builder-toolbar">
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleRun}>
            Run
          </button>
          <span className="toolbar-sep" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (!confirm("Clear all nodes and edges?")) return;
              setNodes([]);
              setEdges([]);
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          >
            Clear
          </button>
          <span className="toolbar-sep" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setScale((s) => Math.min(3, s * 1.2))}
          >
            +
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setScale((s) => Math.max(0.2, s / 1.2))}
          >
            -
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            Fit
          </button>
          <span className="toolbar-sep" />
          <label className="toolbar-label">Max Loops</label>
          <input
            type="number"
            className="toolbar-input-sm"
            min={1}
            max={100}
            value={maxLoops}
            onChange={(e) => setMaxLoops(e.target.value)}
          />
          <span className="toolbar-status">{builderStatus}</span>
        </div>

        {/* Builder body */}
        <div className="builder-body">
          {/* Palette */}
          <div className="node-palette">
            <div className="palette-label">Nodes</div>
            {(["start", "agent", "condition", "tool", "human_review", "end"] as const).map((type) => (
              <div
                key={type}
                className="palette-chip"
                data-type={type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", type)}
              >
                {type === "tool" ? "Pipeline Tool" : type === "human_review" ? "Human Review" : type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
            ))}
          </div>

          {/* SVG Canvas */}
          <div
            className="canvas-wrap"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleDrop}
            onWheel={handleWheel}
          >
            <svg
              ref={svgRef}
              xmlns="http://www.w3.org/2000/svg"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onClick={handleSvgClick}
            >
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="var(--text-secondary)" />
                </marker>
                <marker
                  id="arrow-sel"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill="var(--purple)" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                {/* Edges */}
                {edges.map((edge) => {
                  const from = nodes.find((n) => n.id === edge.from);
                  const to = nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  const isSel = selectedEdgeId === edge.id;
                  const branchPort = edge.branch ? portPositions(from)[edge.branch] : null;

                  return (
                    <g key={edge.id}>
                      <path
                        className={`wf-edge${isSel ? " selected" : ""}`}
                        d={calcEdgePath(from, to, edge.branch)}
                        markerEnd={`url(#${isSel ? "arrow-sel" : "arrow"})`}
                        onClick={(e) => handleEdgeClick(e, edge.id)}
                      />
                      {edge.branch && branchPort && (
                        <text
                          className="edge-branch-label"
                          x={branchPort.x + 8}
                          y={branchPort.y - 4}
                        >
                          {edge.branch}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Draft edge */}
                {draftEdge && (
                  <path className="wf-edge-draft" d={draftEdge} />
                )}

                {/* Nodes */}
                {nodes.map((node) => {
                  const g = nodeGeom(node);
                  const sel = selectedNodeId === node.id;
                  const isRound = node.type === "start" || node.type === "end";
                  const ports = portPositions(node);

                  return (
                    <g
                      key={node.id}
                      className={`wf-node${sel ? " selected" : ""}`}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onClick={(e) => handleNodeClick(e, node.id)}
                    >
                      {/* Shape */}
                      {isRound ? (
                        <circle
                          className="node-body"
                          cx={g.cx}
                          cy={g.cy}
                          r={g.rx}
                          fill="var(--purple)"
                          stroke={sel ? "var(--purple)" : "rgba(83,74,183,0.3)"}
                          strokeWidth="2"
                        />
                      ) : node.type === "human_review" ? (
                        <rect
                          className="node-body"
                          x={node.x}
                          y={node.y}
                          width={g.w}
                          height={g.h}
                          rx={g.rx}
                          fill="var(--purple-dim)"
                          stroke={sel ? "var(--purple)" : "var(--purple)"}
                          strokeWidth="1.5"
                          strokeDasharray="5,3"
                        />
                      ) : node.type === "condition" ? (
                        <polygon
                          className="node-body"
                          points={`${node.x + g.w / 2},${node.y} ${node.x + g.w},${node.y + g.h / 2} ${node.x + g.w / 2},${node.y + g.h} ${node.x},${node.y + g.h / 2}`}
                          fill="var(--amber-dim)"
                          stroke={sel ? "var(--purple)" : "var(--amber)"}
                          strokeWidth="1.5"
                        />
                      ) : node.type === "tool" ? (
                        <polygon
                          className="node-body"
                          points={`${node.x + g.w * 0.25},${node.y} ${node.x + g.w * 0.75},${node.y} ${node.x + g.w},${node.y + g.h / 2} ${node.x + g.w * 0.75},${node.y + g.h} ${node.x + g.w * 0.25},${node.y + g.h} ${node.x},${node.y + g.h / 2}`}
                          fill="var(--teal-dim)"
                          stroke={sel ? "var(--purple)" : "var(--teal)"}
                          strokeWidth="1.5"
                        />
                      ) : (
                        <rect
                          className="node-body"
                          x={node.x}
                          y={node.y}
                          width={g.w}
                          height={g.h}
                          rx={g.rx}
                          fill="#fff"
                          stroke={sel ? "var(--purple)" : "var(--teal)"}
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Label */}
                      <text
                        className="node-label"
                        x={g.cx}
                        y={g.cy + (isRound ? 4 : 1)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={isRound ? "#fff" : "var(--text-primary)"}
                      >
                        {node.label || node.type}
                      </text>

                      {/* Sub-label */}
                      {node.type === "tool" && (
                        <text
                          className="node-type-label"
                          x={g.cx}
                          y={node.y + g.h - 6}
                          textAnchor="middle"
                        >
                          {node.tool_name || "pipeline tool"} · pipeline
                        </text>
                      )}
                      {node.type === "human_review" && (
                        <text
                          className="node-type-label"
                          x={g.cx}
                          y={node.y + g.h - 6}
                          textAnchor="middle"
                          fill="var(--purple)"
                        >
                          human in the loop
                        </text>
                      )}
                      {node.type === "agent" && (() => {
                        const agentObj = node.agent_id ? agentsList.find((a) => a.id === node.agent_id) : null;
                        const toolCount = agentObj?.tools?.length ?? 0;
                        return (
                          <text
                            className="node-type-label"
                            x={g.cx}
                            y={node.y + g.h - 6}
                            textAnchor="middle"
                          >
                            {toolCount > 0 ? `${toolCount} LLM tool${toolCount === 1 ? "" : "s"}` : "agent"}
                          </text>
                        );
                      })()}

                      {/* Ports */}
                      {Object.entries(ports).map(([portKey, pos]) => (
                        <React.Fragment key={portKey}>
                          <circle
                            className={`port${portKey === "in" ? " port-in" : ""}`}
                            cx={pos.x}
                            cy={pos.y}
                            r={6}
                            data-node-id={node.id}
                            data-port-key={portKey}
                            {...(pos.branch ? { "data-branch": pos.branch } : {})}
                          />
                          {portKey !== "in" && (
                            <circle
                              className="port-hit"
                              cx={pos.x}
                              cy={pos.y}
                              r={16}
                              data-node-id={node.id}
                              data-port-key={portKey}
                              {...(pos.branch ? { "data-branch": pos.branch } : {})}
                              onMouseDown={(e) =>
                                handlePortMouseDown(e, node.id, pos.branch || null)
                              }
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Config panel */}
          <div className="config-panel">
            <h3>Properties</h3>
            {!selectedNode && !selectedEdge && (
              <p className="config-panel-empty">Select a node or edge.</p>
            )}
            {selectedNode && (
              <NodeConfigPanel
                node={selectedNode}
                agentsList={agentsList}
                onUpdate={(patch) => updateNode(selectedNodeId!, patch)}
                onDelete={() => removeNode(selectedNodeId!)}
                toolConfig={toolConfig}
                onUpdateToolConfig={handleUpdateToolConfig}
                toolParams={toolParams}
              />
            )}
            {!selectedNode && selectedEdge && (
              <EdgeConfigPanel edge={selectedEdge} onDelete={() => removeEdge(selectedEdgeId!)} />
            )}
          </div>
        </div>

        {/* Run log */}
        <div className="run-log-wrap">
          <div className="run-log-header" onClick={() => setRunLogVisible((v) => !v)}>
            <span>Run Log</span>
            <span className="run-log-toggle">{runLogVisible ? "▼" : "▲"}</span>
          </div>
          {runLogVisible && (
            <div className="run-log-body" ref={runLogBodyRef}>
              {runLog.map((line, i) => (
                <div key={i} className={`log-line ${line.cls}`}>
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HITL review panel */}
        {reviewPending && (
          <div className="hitl-panel">
            <div className="hitl-panel-header">Human Review Required — node: {reviewPending.nodeId}</div>
            <div className="hitl-panel-prompt">{reviewPending.prompt}</div>
            {reviewPending.context && (
              <>
                <div className="hitl-context-label">Agent output</div>
                <div className="hitl-panel-context">{reviewPending.context}</div>
              </>
            )}
            <textarea
              className="hitl-input"
              rows={4}
              placeholder="Enter your feedback, approval, or revised instructions…"
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleResumeRun}
              disabled={!reviewInput.trim()}
            >
              Submit &amp; Continue
            </button>
          </div>
        )}

        {/* Run history */}
        <details className="runs-history">
          <summary>Run History</summary>
          <div className="runs-history-body">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Finished</th>
                    <th>Tokens</th>
                    <th>Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No runs yet.
                      </td>
                    </tr>
                  ) : (
                    runs.map((r) => {
                      const cls =
                        (
                          {
                            pending: "badge-grey",
                            running: "badge-blue",
                            completed: "badge-teal",
                            failed: "badge-red",
                            awaiting_review: "badge-purple",
                          } as Record<string, string>
                        )[r.status] || "badge-grey";
                      return (
                        <tr key={r.id}>
                          <td title={r.id}>{r.id.slice(0, 8)}…</td>
                          <td>
                            <span className={`badge ${cls}`}>{r.status}</span>
                          </td>
                          <td>
                            {r.started_at ? new Date(r.started_at).toLocaleTimeString() : "—"}
                          </td>
                          <td>
                            {r.finished_at ? new Date(r.finished_at).toLocaleTimeString() : "—"}
                          </td>
                          <td>
                            {r.usage?.total_tokens != null
                              ? r.usage.total_tokens.toLocaleString()
                              : "—"}
                          </td>
                          <td>
                            {r.usage?.estimated_cost_usd != null
                              ? "$" + r.usage.estimated_cost_usd.toFixed(4)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
