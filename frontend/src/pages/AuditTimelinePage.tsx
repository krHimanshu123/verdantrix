import { useEffect } from "react";
import EmptyState from "../components/EmptyState";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchAuditLogs } from "../services/api";
import { AuditLogEntry } from "../types";

export default function AuditTimelinePage() {
  useEffect(() => {
    document.title = "Verdantrix — Audit Timeline";
  }, []);

  const auditState = useAsyncData(() => fetchAuditLogs({ ordering: "-timestamp" }).then((response) => response.data), []);

  return (
    <div className="space-y-6">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Traceability</p>
          <h1 className="workspace-title">Audit Timeline</h1>
          <p className="workspace-copy">Focused change log across ingestion, note edits, analyst decisions, and final audit locks.</p>
        </div>
      </div>

      {auditState.loading ? <div className="panel"><div className="panel-body">Loading Verdantrix audit activity...</div></div> : null}
      {auditState.error ? <EmptyState title="Audit history unavailable" description={auditState.error} /> : null}

      {!auditState.loading && !auditState.error && !auditState.data?.length ? (
        <EmptyState title="No audit entries yet" description="Ingest or review records to populate the Verdantrix audit timeline." />
      ) : null}

      {auditState.data?.length ? (
        <div className="space-y-4">
          {auditState.data.map((entry: AuditLogEntry) => (
            <div key={entry.id} className="panel">
              <div className="panel-body grid gap-4 lg:grid-cols-[240px_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatAction(entry.action_type)}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{entry.emission_record_reference}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Actor: {entry.changed_by_username || "system"}</p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    {summarizeChange(entry)}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ValueBlock title="Previous" value={entry.old_value} />
                    <ValueBlock title="Updated" value={entry.new_value} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ValueBlock({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

function summarizeChange(entry: AuditLogEntry) {
  if (entry.action_type === "ingested") {
    return `Record entered the normalized review queue with validation status ${String(entry.new_value?.validation_status || "unknown")} and anomaly score ${String(entry.new_value?.anomaly_score || "0")}.`;
  }

  const previousStatus = entry.old_value?.analyst_status;
  const updatedStatus = entry.new_value?.analyst_status;
  if (previousStatus !== updatedStatus && updatedStatus) {
    return `Analyst status moved from ${String(previousStatus || "unset")} to ${String(updatedStatus)}.`;
  }

  if (entry.old_value?.analyst_notes !== entry.new_value?.analyst_notes) {
    return "Analyst notes were updated for this record.";
  }

  if (entry.new_value?.locked_for_audit) {
    return "Record was locked to preserve the final audit state.";
  }

  return "Record state was updated.";
}
