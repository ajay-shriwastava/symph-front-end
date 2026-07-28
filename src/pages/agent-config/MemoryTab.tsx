import React, { useState, useCallback } from "react";
import { getAgentMemory, upsertMemory, deleteMemory } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import Pagination from "../../components/Pagination.tsx";
import LoadingRows from "../../components/LoadingRows.tsx";
import { useApiList } from "../../hooks/useApiList.ts";
import { truncate } from "../../utils/truncate.ts";
import { PAGE_SIZE } from "../../config.ts";

export default function MemoryTab({ agentId }: { agentId: string }) {
  const showToast = useToast();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const fetcher = useCallback(
    (skip: number, limit: number) => getAgentMemory(agentId, skip, limit),
    [agentId],
  );

  const { items, total, skip, loading, setSkip, reload } = useApiList(fetcher, PAGE_SIZE);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertMemory(agentId, { key, value });
      showToast("Memory saved.");
      setKey("");
      setValue("");
      reload();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleDelete(k: string) {
    if (!confirm(`Delete memory key "${k}"?`)) return;
    try {
      await deleteMemory(agentId, k);
      showToast("Memory entry deleted.");
      reload();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return (
    <div id="tab-memory" className="tab-panel active">
      <form className="inline-form visible" onSubmit={handleSave} autoComplete="off">
        <div className="form-group">
          <label>Key *</label>
          <input
            type="text"
            required
            maxLength={255}
            placeholder="e.g. user_name"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <div className="form-group form-group-wide">
          <label>Value *</label>
          <textarea
            required
            placeholder="Value to store"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Updated</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows colSpan={4} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  No memory entries.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.key}>
                  <td>{m.key}</td>
                  <td>{truncate(m.value, 80)}</td>
                  <td>{new Date(m.updated_at || m.created_at).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.key)}>
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
  );
}
