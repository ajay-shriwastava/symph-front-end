import React, { useState, useCallback } from "react";
import { getLogs } from "../js/api.ts";
import type { LogLevel, LogFilters } from "../js/api.ts";
import Pagination from "../components/Pagination.tsx";
import LoadingRows from "../components/LoadingRows.tsx";
import { useApiList } from "../hooks/useApiList.ts";
import { truncate } from "../utils/truncate.ts";
import { PAGE_SIZE } from "../config.ts";

const LEVEL_BADGE: Record<LogLevel, string> = {
  DEBUG: "badge-grey",
  INFO: "badge-blue",
  WARNING: "badge-amber",
  ERROR: "badge-red",
};

export default function Logs() {
  const [filters, setFilters] = useState<LogFilters>({});
  const [levelInput, setLevelInput] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [workflowInput, setWorkflowInput] = useState("");

  const fetcher = useCallback(
    (skip: number, limit: number) => getLogs({ ...filters, skip, limit }),
    [filters],
  );

  const { items: logs, total, skip, loading, setSkip } = useApiList(fetcher, PAGE_SIZE);

  function applyFilters() {
    const f: LogFilters = {};
    if (levelInput) f.level = levelInput as LogLevel;
    if (agentInput.trim()) f.agent_id = agentInput.trim();
    if (workflowInput.trim()) f.workflow_id = workflowInput.trim();
    setFilters(f);
  }

  function clearFilters() {
    setLevelInput("");
    setAgentInput("");
    setWorkflowInput("");
    setFilters({});
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Logs</h1>
      </div>
      <div className="card">
        <div className="filter-bar">
          <select value={levelInput} onChange={(e) => setLevelInput(e.target.value)}>
            <option value="">All Levels</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
          <input
            type="text"
            placeholder="Agent ID"
            className="filter-input-md"
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
          />
          <input
            type="text"
            placeholder="Workflow ID"
            className="filter-input-md"
            value={workflowInput}
            onChange={(e) => setWorkflowInput(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={applyFilters}>
            Apply
          </button>
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Message</th>
                <th>Agent ID</th>
                <th>Workflow ID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRows colSpan={5} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={`badge ${LEVEL_BADGE[log.level] || "badge-grey"}`}>
                        {log.level}
                      </span>
                    </td>
                    <td>{truncate(log.message, 100)}</td>
                    <td>{log.agent_id ? log.agent_id.slice(0, 8) + "…" : "—"}</td>
                    <td>{log.workflow_id ? log.workflow_id.slice(0, 8) + "…" : "—"}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          skip={skip}
          limit={PAGE_SIZE}
          total={total}
          onPrev={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
          onNext={() => setSkip((s) => s + PAGE_SIZE)}
        />
      </div>
    </main>
  );
}
