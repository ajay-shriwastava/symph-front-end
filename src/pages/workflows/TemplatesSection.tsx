import { useState, useEffect } from "react";
import { getTemplates, instantiateTemplate } from "../../js/api.ts";
import type { Template } from "../../js/api.ts";
import { useToast } from "../../context/ToastContext.tsx";

function TemplateCard({ template: t, onCreated }: { template: Template; onCreated: () => void }) {
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleUse() {
    setLoading(true);
    try {
      const wf = await instantiateTemplate(t.id);
      showToast(`"${wf.name}" created and scheduled.`);
      onCreated();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="template-card">
      <div className="template-card-name">{t.name}</div>
      <div className="template-card-desc">{t.description}</div>
      {t.schedule && (
        <div className="template-card-schedule">
          <span className="badge badge-teal">⏱ {t.schedule}</span>
        </div>
      )}
      <button className="btn btn-primary btn-sm" onClick={handleUse} disabled={loading}>
        {loading ? "Creating…" : "Use Template"}
      </button>
    </div>
  );
}

export default function TemplatesSection({ onCreated }: { onCreated: () => void }) {
  const showToast = useToast();
  const [templates, setTemplates] = useState<Template[] | null>(null);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch((e) => {
        setTemplates([]);
        showToast((e as Error).message, "error");
      });
  }, [showToast]);

  if (!templates) return null;

  return (
    <div className="card card-spaced">
      <div className="page-header templates-header">
        <h2 className="page-title templates-title">Workflow Templates</h2>
      </div>
      <div className="templates-grid">
        {templates.length === 0 ? (
          <span className="templates-empty">No templates available.</span>
        ) : (
          templates.map((t) => <TemplateCard key={t.id} template={t} onCreated={onCreated} />)
        )}
      </div>
    </div>
  );
}
