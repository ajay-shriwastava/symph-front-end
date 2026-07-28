import type { GraphNode } from "../../js/api.ts";

// ── Local types ──────────────────────────────────────────────────────────────
export interface NodeDims {
  w: number;
  h: number;
  rx: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Port extends Point {
  branch?: string;
}
export type PortMap = Record<string, Port>;

export interface RunLogLine {
  text: string;
  cls: string;
}

export type InteractionMode = "idle" | "drag-node" | "panning" | "drawing-edge";

export interface InteractionState {
  mode: InteractionMode;
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
  panStartX: number;
  panStartY: number;
  fromNodeId: string | null;
  fromBranch: string | null;
}

// ── Geometry helpers ─────────────────────────────────────────────────────────
export const NODE_DIMS: Record<GraphNode["type"], NodeDims> = {
  start: { w: 56, h: 56, rx: 28 },
  end: { w: 56, h: 56, rx: 28 },
  agent: { w: 130, h: 52, rx: 8 },
  tool: { w: 130, h: 52, rx: 8 },
  condition: { w: 100, h: 52, rx: 4 },
};

export function nodeGeom(node: GraphNode) {
  const g = NODE_DIMS[node.type] || NODE_DIMS.agent;
  return { cx: node.x + g.w / 2, cy: node.y + g.h / 2, w: g.w, h: g.h, rx: g.rx };
}

export function portPositions(node: GraphNode): PortMap {
  const g = nodeGeom(node);
  const ports: PortMap = {
    in: { x: node.x, y: g.cy },
    out: { x: node.x + g.w, y: g.cy },
  };
  if (node.type === "condition") {
    ports.true = { x: node.x + g.w, y: node.y + g.h * 0.25, branch: "true" };
    ports.false = { x: node.x + g.w, y: node.y + g.h * 0.75, branch: "false" };
    delete ports.out;
  }
  return ports;
}

export function calcEdgePath(fromNode: GraphNode, toNode: GraphNode, branch?: string): string {
  const fp_ports = portPositions(fromNode);
  const fp =
    fromNode.type === "condition" && branch
      ? fp_ports[branch] || fp_ports.true
      : fp_ports.out || fp_ports.true;
  if (!fp) return "";
  const tp = portPositions(toNode).in;
  const dx = Math.abs(tp.x - fp.x) * 0.5;
  return `M ${fp.x} ${fp.y} C ${fp.x + dx} ${fp.y}, ${tp.x - dx} ${tp.y}, ${tp.x} ${tp.y}`;
}

export function genId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 7);
}
