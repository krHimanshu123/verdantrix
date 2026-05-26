import { useEffect, useMemo, useState } from "react";
import AlertBanner from "../components/AlertBanner";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import StatusPill from "../components/StatusPill";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchEmissionRecords, reviewRecord, updateRecord } from "../services/api";
import { EmissionRecord } from "../types";

export default function ReviewConsolePage() {
  useEffect(() => {
    document.title = "Verdantrix — Review Console";
  }, []);

  const [sourceType, setSourceType] = useState("");
  const [analystStatus, setAnalystStatus] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ record: EmissionRecord; action: string; notes: string } | null>(null);

  const recordState = useAsyncData(
    () =>
      fetchEmissionRecords({
        ...(sourceType ? { source_type: sourceType } : {}),
        ...(analystStatus ? { analyst_status: analystStatus } : {}),
        ...(validationStatus ? { validation_status: validationStatus } : {}),
        ordering: "-anomaly_score"
      }).then((response) => response.data),
    [sourceType, analystStatus, validationStatus, refreshKey]
  );

  const summary = useMemo(() => {
    const list = recordState.data || [];
    return {
      total: list.length,
      highRisk: list.filter((record) => Number(record.anomaly_score) >= 60).length,
      pending: list.filter((record) => record.analyst_status === "pending").length
    };
  }, [recordState.data]);

  async function saveNotes(record: EmissionRecord, notes: string) {
    try {
      await updateRecord(record.id, { analyst_notes: notes });
      setMessage({ tone: "info", text: `Notes saved for ${record.source_reference}.` });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessage({ tone: "error", text: "Notes could not be saved for this record." });
    }
  }

  async function confirmAction() {
    if (!pendingAction) {
      return;
    }

    try {
      await reviewRecord(pendingAction.record.id, pendingAction.action, pendingAction.notes);
      setMessage({ tone: "info", text: `${labelForAction(pendingAction.action)} completed for ${pendingAction.record.source_reference}.` });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessage({ tone: "error", text: "Review action could not be completed." });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Workflow</p>
          <h1 className="workspace-title">Review Console</h1>
          <p className="workspace-copy">Review normalized records, document analyst decisions, and lock final rows once they are ready for audit.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[540px]">
          <select className="select min-w-40" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
            <option value="">All sources</option>
            <option value="sap">SAP</option>
            <option value="utility">Utility</option>
            <option value="travel">Travel</option>
          </select>
          <select className="select min-w-40" value={validationStatus} onChange={(event) => setValidationStatus(event.target.value)}>
            <option value="">All validation</option>
            <option value="valid">Valid</option>
            <option value="flagged">Flagged</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="select min-w-40" value={analystStatus} onChange={(event) => setAnalystStatus(event.target.value)}>
            <option value="">All analyst states</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {message ? <AlertBanner message={message.text} tone={message.tone} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Records in view" value={summary.total} />
        <SummaryCard label="High anomaly score" value={summary.highRisk} />
        <SummaryCard label="Pending analyst actions" value={summary.pending} />
      </div>

      {recordState.loading ? <div className="panel"><div className="panel-body">Loading review queue...</div></div> : null}
      {recordState.error ? <EmptyState title="Review queue unavailable" description={recordState.error} /> : null}

      {!recordState.loading && !recordState.error && !recordState.data?.length ? (
        <EmptyState title="No matching records" description="Adjust filters or ingest new source data to continue review." />
      ) : null}

      {recordState.data?.length ? (
        <div className="table-shell">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-semibold">Analyst Queue</h2>
              <p className="text-sm text-slate-500">Sorted by anomaly score so the riskiest records stay at the top.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-compact sticky-head min-w-[1480px]">
              <thead>
                <tr>
                  {["Source", "Reference", "Activity", "Quantity", "Validation", "Analyst", "Audit", "Anomaly", "Notes", "Actions"].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recordState.data.map((record) => (
                  <ReviewRow key={record.id} record={record} onSaveNotes={saveNotes} onAction={(action, notes) => setPendingAction({ record, action, notes })} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        open={Boolean(pendingAction)}
        title={pendingAction ? `${labelForAction(pendingAction.action)} record` : ""}
        description={
          pendingAction
            ? `This will mark ${pendingAction.record.source_reference} as ${pendingAction.action}. Locked records cannot be edited later.`
            : ""
        }
        confirmLabel={pendingAction ? labelForAction(pendingAction.action) : "Confirm"}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel">
      <div className="panel-body">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ReviewRow({
  record,
  onSaveNotes,
  onAction
}: {
  record: EmissionRecord;
  onSaveNotes: (record: EmissionRecord, notes: string) => Promise<void>;
  onAction: (action: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState(record.analyst_notes || "");
  const disabled = record.locked_for_audit;
  const anomaly = Number(record.anomaly_score);
  const anomalyClass =
    anomaly >= 60
      ? "bg-rose-100 text-rose-700"
      : anomaly >= 20
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <tr className={`align-top ${disabled ? "bg-slate-50/80" : ""}`}>
      <td>
        <div className="font-medium capitalize">{record.source_type}</div>
        <div className="mt-1 text-xs text-slate-500">{record.scope_category}</div>
      </td>
      <td>
        <div className="font-medium text-slate-800">{record.source_reference}</div>
        <div className="mt-1 text-xs text-slate-500">{record.source_file_name}</div>
      </td>
      <td>
        <div className="font-medium capitalize">{record.activity_type.replace(/_/g, " ")}</div>
        <div className="mt-1 text-xs text-slate-500">{record.emission_category.replace(/_/g, " ")}</div>
      </td>
      <td>
        <div className="font-medium">{record.normalized_quantity} {record.normalized_unit}</div>
        <div className="mt-1 text-xs text-slate-500">{record.estimated_co2e} tCO2e</div>
      </td>
      <td><StatusPill value={record.validation_status} /></td>
      <td>
        <StatusPill value={record.analyst_status} />
        {disabled ? <div className="mt-2 text-xs font-medium text-slate-500">Locked for audit</div> : null}
      </td>
      <td>
        <div className="text-sm font-medium text-slate-900">{record.audit_count} event{record.audit_count === 1 ? "" : "s"}</div>
        <div className="mt-1 text-xs text-slate-500">Updated {new Date(record.updated_at).toLocaleDateString()}</div>
      </td>
      <td>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${anomalyClass}`}>
          {record.anomaly_score}
        </div>
        <div className="mt-2 text-xs text-slate-500">{anomaly >= 60 ? "Immediate review" : anomaly >= 20 ? "Needs attention" : "Within baseline"}</div>
      </td>
      <td>
        <textarea
          className="input min-h-24"
          value={notes}
          disabled={disabled}
          onChange={(event) => setNotes(event.target.value)}
        />
        <button type="button" className="mt-3 button-secondary" disabled={disabled} onClick={() => onSaveNotes(record, notes)}>
          Save note
        </button>
      </td>
      <td>
        <div className="flex flex-col gap-2">
          <button type="button" className="button-primary" disabled={disabled} onClick={() => onAction("approve", notes)}>
            Approve
          </button>
          <button type="button" className="button-secondary" disabled={disabled} onClick={() => onAction("reject", notes)}>
            Reject
          </button>
          <button type="button" className="button-secondary" disabled={disabled} onClick={() => onAction("lock", notes)}>
            Lock for audit
          </button>
        </div>
      </td>
    </tr>
  );
}

function labelForAction(action: string) {
  if (action === "approve") {
    return "Approve";
  }
  if (action === "reject") {
    return "Reject";
  }
  return "Lock for audit";
}
