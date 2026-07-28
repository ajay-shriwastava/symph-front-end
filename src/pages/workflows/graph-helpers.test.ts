import { nodeGeom, portPositions, calcEdgePath, genId, NODE_DIMS } from "./graph-helpers.ts";
import type { GraphNode } from "../../js/api.ts";

const agentNode: GraphNode = {
  id: "a1",
  type: "agent",
  x: 100,
  y: 200,
  label: "Agent",
};

const startNode: GraphNode = {
  id: "s1",
  type: "start",
  x: 0,
  y: 0,
  label: "Start",
};

const condNode: GraphNode = {
  id: "c1",
  type: "condition",
  x: 300,
  y: 100,
  label: "Check",
};

describe("nodeGeom", () => {
  it("computes center and dimensions for an agent node", () => {
    const g = nodeGeom(agentNode);
    const dims = NODE_DIMS.agent;
    expect(g.w).toBe(dims.w);
    expect(g.h).toBe(dims.h);
    expect(g.cx).toBe(agentNode.x + dims.w / 2);
    expect(g.cy).toBe(agentNode.y + dims.h / 2);
  });

  it("computes round geometry for start node", () => {
    const g = nodeGeom(startNode);
    expect(g.rx).toBe(28);
    expect(g.w).toBe(56);
  });
});

describe("portPositions", () => {
  it("returns in/out ports for agent node", () => {
    const ports = portPositions(agentNode);
    expect(ports.in).toBeDefined();
    expect(ports.out).toBeDefined();
    expect(ports.in.x).toBe(agentNode.x);
    expect(ports.out.x).toBe(agentNode.x + NODE_DIMS.agent.w);
  });

  it("returns true/false ports (no out) for condition node", () => {
    const ports = portPositions(condNode);
    expect(ports.in).toBeDefined();
    expect(ports.true).toBeDefined();
    expect(ports.false).toBeDefined();
    expect(ports.out).toBeUndefined();
    expect(ports.true.branch).toBe("true");
    expect(ports.false.branch).toBe("false");
  });
});

describe("calcEdgePath", () => {
  it("returns a non-empty SVG path between two nodes", () => {
    const path = calcEdgePath(startNode, agentNode);
    expect(path).toMatch(/^M /);
    expect(path).toContain("C ");
  });

  it("uses branch port for condition nodes", () => {
    const path = calcEdgePath(condNode, agentNode, "true");
    expect(path).toMatch(/^M /);
  });
});

describe("genId", () => {
  it("starts with the given prefix", () => {
    const id = genId("node");
    expect(id).toMatch(/^node_/);
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => genId("x")));
    expect(ids.size).toBe(50);
  });
});
