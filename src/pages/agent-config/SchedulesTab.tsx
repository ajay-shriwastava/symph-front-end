import React, { useState, useEffect, useCallback } from "react";
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from "../../js/api.ts";
import type { Schedule } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import LoadingRows from "../../components/LoadingRows.tsx";

interface ScheduleEditForm {
  label: string;
  cron: string;
  enabled: boolean;
}

export default function SchedulesTab({ agentId }: { agentId: string }) {
  const showToast = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [cron, setCron] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ScheduleEditForm>({
    label: "",
    cron: "",
    enabled: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSchedules(agentId);
      setSchedules(data.items || []);
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [agentId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createSchedule(agentId, { label, cron_expression: cron, enabled });
      showToast("Schedule added.");
      setLabel("");
      setCron("");
      setEnabled(true);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleUpdate(scheduleId: string) {
    if (!editForm.label.trim() || !editForm.cron.trim()) {
      showToast("Label and cron expression are required.", "error");
      return;
    }
    try {
      await updateSchedule(agentId, scheduleId, {
        label: editForm.label.trim(),
        cron_expression: editForm.cron.trim(),
        enabled: editForm.enabled,
      });
      showToast("Schedule updated.");
      setEditingId(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleDelete(scheduleId: string) {
    if (!confirm("Delete this schedule?")) return;
    try {
      await deleteSchedule(agentId, scheduleId);
      showToast("Schedule deleted.");
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return (
    <div id="tab-schedules" className="tab-panel active">
      <form className="inline-form visible" onSubmit={handleAdd} autoComplete="off">
        <div className="form-group">
          <label>Label *</label>
          <input
            type="text"
            required
            maxLength={255}
            placeholder="Daily 9am"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Cron Expression *</label>
          <input
            type="text"
            required
            maxLength={100}
            placeholder="0 9 * * 1-5"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
          />
        </div>
        <div className="form-group checkbox-group form-group-fixed">
          <input
            type="checkbox"
            id="s-enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <label htmlFor="s-enabled">Enabled</label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </div>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Cron</th>
              <th>Enabled</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows colSpan={5} />
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No schedules configured.
                </td>
              </tr>
            ) : (
              schedules.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="text"
                        className="inline-edit-input"
                        value={editForm.label}
                        onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="inline-edit-input"
                        value={editForm.cron}
                        onChange={(e) => setEditForm((f) => ({ ...f, cron: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.checked }))}
                      />
                    </td>
                    <td></td>
                    <td>
                      <div className="btn-group-inline">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdate(s.id)}
                        >
                          Update
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id}>
                    <td>{s.label}</td>
                    <td>{s.cron_expression}</td>
                    <td>
                      <span className={`badge ${s.enabled ? "badge-teal" : "badge-grey"}`}>
                        {s.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                    <td>
                      <div className="btn-group-inline">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingId(s.id);
                            setEditForm({
                              label: s.label,
                              cron: s.cron_expression,
                              enabled: s.enabled,
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(s.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
