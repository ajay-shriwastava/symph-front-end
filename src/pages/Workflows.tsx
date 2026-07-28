import React, { useState, useEffect, useCallback } from "react";
import {
  getAgents,
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "../js/api.ts";
import type { Agent, Workflow } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";
import Pagination from "../components/Pagination.tsx";
import LoadingRows from "../components/LoadingRows.tsx";
import { useApiList } from "../hooks/useApiList.ts";
import { truncate } from "../utils/truncate.ts";
import TemplatesSection from "./workflows/TemplatesSection.tsx";
import WorkflowBuilder from "./workflows/WorkflowBuilder.tsx";

import { PAGE_SIZE, AGENT_DROPDOWN_LIMIT } from "../config.ts";

const STATUS_BADGE: Record<Workflow["status"], string> = {
  draft: "badge-grey",
  active: "badge-teal",
  archived: "badge-amber",
};

export default function Workflows() {
  const showToast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [openWorkflow, setOpenWorkflow] = useState<Workflow | null>(null);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);

  const fetcher = useCallback(
    (skip: number, limit: number) => getWorkflows(skip, limit),
    [],
  );

  const { items: workflows, total, skip, loading, setSkip, reload } = useApiList(fetcher, PAGE_SIZE);

  useEffect(() => {
    getAgents(0, AGENT_DROPDOWN_LIMIT)
      .then((r) => setAgentsList(r.items))
      .catch(() => {});
  }, []);

  function openNew() {
    setEditingWf(null);
    setNameInput("");
    setDescInput("");
    setFormOpen(true);
  }

  function openEdit(wf: Workflow) {
    setEditingWf(wf);
    setNameInput(wf.name);
    setDescInput(wf.description || "");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingWf(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: nameInput.trim(), description: descInput.trim() || null };
    try {
      if (editingWf) {
        await updateWorkflow(editingWf.id, payload);
        showToast("Workflow updated.");
      } else {
        await createWorkflow(payload);
        showToast("Workflow created.");
      }
      closeForm();
      reload();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleDelete(wf: Workflow) {
    if (!confirm(`Delete workflow "${wf.name}"?`)) return;
    try {
      await deleteWorkflow(wf.id);
      showToast("Workflow deleted.");
      if (openWorkflow?.id === wf.id) setOpenWorkflow(null);
      reload();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }

  return (
    <main className="page page-wide">
      <TemplatesSection onCreated={reload} />

      <div className="page-header">
        <h1 className="page-title">Workflows</h1>
        <button className="btn btn-primary" onClick={openNew}>
          + New Workflow
        </button>
      </div>

      <div className="card card-spaced">
        {formOpen && (
          <form className="inline-form visible" onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                required
                maxLength={255}
                placeholder="My Workflow"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
            </div>
            <div className="form-group form-group-wide">
              <label>Description</label>
              <textarea
                placeholder="What does this workflow do?"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingWf ? "Update" : "Create"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRows colSpan={5} />
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No workflows found.
                  </td>
                </tr>
              ) : (
                workflows.map((w) => (
                  <tr key={w.id}>
                    <td>{w.name}</td>
                    <td>{truncate(w.description, 55)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[w.status] || "badge-grey"}`}>
                        {w.status || "draft"}
                      </span>
                    </td>
                    <td>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setOpenWorkflow(w)}
                      >
                        Open
                      </button>
                      <button
                        className="btn btn-secondary btn-sm btn-ml-sm"
                        onClick={() => openEdit(w)}
                      >
                        Rename
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-ml-sm"
                        onClick={() => handleDelete(w)}
                      >
                        Delete
                      </button>
                    </td>
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

      {openWorkflow && (
        <WorkflowBuilder
          workflow={openWorkflow}
          agentsList={agentsList}
          onClose={() => setOpenWorkflow(null)}
          onSaved={reload}
        />
      )}
    </main>
  );
}
