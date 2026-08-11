import { render, screen, fireEvent } from "@testing-library/react";
import { NodeConfigPanel } from "./NodeConfigPanel.tsx";
import type { GraphNode, Agent, ToolParam } from "../../js/api.ts";

const toolParams: Record<string, ToolParam[]> = {
  csv_scanner: [{ name: "dataset_dir", label: "Dataset Directory", type: "string", required: false }],
  scan_csv: [{ name: "dataset_dir", label: "Dataset Directory", type: "string", required: false }],
  publish_report: [
    { name: "slack_channel", label: "Slack Channel", type: "string", required: false },
    { name: "dataset_dir", label: "Dataset Directory", type: "string", required: false },
  ],
};

const mockAgent: Agent = {
  id: "agent-1",
  name: "Data Agent",
  model: "claude-haiku-4-5-20251001",
  description: null,
  system_prompt: null,
  tools: ["scan_csv", "publish_report"],
  channels: [],
  memory_enabled: false,
  interaction_rules: null,
  guardrails: null,
  message_log_level: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const baseProps = {
  agentsList: [mockAgent],
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  toolConfig: {},
  onUpdateToolConfig: vi.fn(),
  toolParams,
};

describe("NodeConfigPanel — tool node param fields", () => {
  it("renders param input for a selected pipeline tool", () => {
    const node: GraphNode = {
      id: "t1", type: "tool", label: "Scanner", x: 0, y: 0, tool_name: "csv_scanner",
    };
    render(<NodeConfigPanel {...baseProps} node={node} />);
    expect(screen.getByPlaceholderText("dataset_dir")).toBeInTheDocument();
  });

  it("shows no param inputs when tool has no params", () => {
    const node: GraphNode = {
      id: "t1", type: "tool", label: "Stats", x: 0, y: 0, tool_name: "job_stats_collector",
    };
    render(<NodeConfigPanel {...baseProps} node={node} />);
    expect(screen.queryByPlaceholderText("dataset_dir")).not.toBeInTheDocument();
  });

  it("shows existing toolConfig value in input", () => {
    const node: GraphNode = {
      id: "t1", type: "tool", label: "Scanner", x: 0, y: 0, tool_name: "csv_scanner",
    };
    render(
      <NodeConfigPanel
        {...baseProps}
        node={node}
        toolConfig={{ csv_scanner: { dataset_dir: "/mnt/data" } }}
      />,
    );
    expect(screen.getByDisplayValue("/mnt/data")).toBeInTheDocument();
  });

  it("calls onUpdateToolConfig when param field changes", () => {
    const onUpdateToolConfig = vi.fn();
    const node: GraphNode = {
      id: "t1", type: "tool", label: "Scanner", x: 0, y: 0, tool_name: "csv_scanner",
    };
    render(
      <NodeConfigPanel {...baseProps} node={node} onUpdateToolConfig={onUpdateToolConfig} />,
    );
    fireEvent.change(screen.getByPlaceholderText("dataset_dir"), { target: { value: "/new/path" } });
    expect(onUpdateToolConfig).toHaveBeenCalledWith("csv_scanner", "dataset_dir", "/new/path");
  });
});

describe("NodeConfigPanel — agent node LLM tool param fields", () => {
  it("renders LLM tool params for agent's tools", () => {
    const node: GraphNode = {
      id: "a1", type: "agent", label: "Data Agent", x: 0, y: 0, agent_id: "agent-1",
    };
    render(<NodeConfigPanel {...baseProps} node={node} />);
    // Agent has scan_csv + publish_report — both have dataset_dir param
    const datasetDirInputs = screen.getAllByPlaceholderText("dataset_dir");
    expect(datasetDirInputs.length).toBeGreaterThanOrEqual(1);
    // publish_report also has slack_channel
    expect(screen.getByPlaceholderText("slack_channel")).toBeInTheDocument();
  });

  it("shows no LLM param inputs when agent has no tools with params", () => {
    const agentNoTools: Agent = { ...mockAgent, id: "agent-2", tools: [] };
    const node: GraphNode = {
      id: "a1", type: "agent", label: "No Tools Agent", x: 0, y: 0, agent_id: "agent-2",
    };
    render(
      <NodeConfigPanel {...baseProps} node={node} agentsList={[agentNoTools]} />,
    );
    expect(screen.queryByPlaceholderText("dataset_dir")).not.toBeInTheDocument();
  });

  it("calls onUpdateToolConfig with correct tool name for LLM tool params", () => {
    const onUpdateToolConfig = vi.fn();
    const node: GraphNode = {
      id: "a1", type: "agent", label: "Data Agent", x: 0, y: 0, agent_id: "agent-1",
    };
    render(
      <NodeConfigPanel {...baseProps} node={node} onUpdateToolConfig={onUpdateToolConfig} />,
    );
    fireEvent.change(screen.getByPlaceholderText("slack_channel"), { target: { value: "dev-alerts" } });
    expect(onUpdateToolConfig).toHaveBeenCalledWith("publish_report", "slack_channel", "dev-alerts");
  });
});
