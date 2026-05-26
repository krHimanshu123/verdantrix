import { ChangeEvent, DragEvent, ReactNode, useEffect, useMemo, useState } from "react";
import AlertBanner from "../components/AlertBanner";
import EmptyState from "../components/EmptyState";
import StatusPill from "../components/StatusPill";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchDataSources, fetchOrganizations, syncTravel, uploadFile } from "../services/api";
import { DataSourceSummary, Organization } from "../types";

type UploadKind = "sap" | "utility";

export default function UploadCenterPage() {
  useEffect(() => {
    document.title = "Verdantrix — Upload Center";
  }, []);

  const orgState = useAsyncData(() => fetchOrganizations().then((response) => response.data), []);
  const sourceState = useAsyncData(() => fetchDataSources().then((response) => response.data), []);
  const [selectedOrg, setSelectedOrg] = useState<number>(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState<UploadKind | null>(null);
  const [lastSummary, setLastSummary] = useState<null | {
    source: string;
    processed_rows: number;
    created_records: number;
    flagged_records: number;
    rejected_records: number;
  }>(null);

  useEffect(() => {
    const firstOrg = orgState.data?.[0];
    if (!firstOrg) return;

    const orgIds = new Set((orgState.data || []).map((org) => org.id));
    const selectedIsValid = selectedOrg !== 0 && orgIds.has(selectedOrg);
    if (!selectedIsValid) setSelectedOrg(firstOrg.id);
  }, [orgState.data, selectedOrg]);

  async function submitFile(kind: UploadKind, file: File | null | undefined) {
    if (!file) {
      return;
    }
    setBusy(kind);
    setMessage(null);
    try {
      const endpoint = kind === "sap" ? "/ingestion/sap/upload/" : "/ingestion/utility/upload/";
      const response = await uploadFile(endpoint, file, selectedOrg, (value) =>
        setProgress((current) => ({ ...current, [kind]: value }))
      );
      setMessage({ tone: "info", text: response.message });
      setLastSummary({
        source: kind,
        processed_rows: response.data.processed_rows,
        created_records: response.data.created_records,
        flagged_records: response.data.flagged_records,
        rejected_records: response.data.rejected_records,
      });
      sourceState.setData(await fetchDataSources().then((result) => result.data));
    } catch (error) {
      setMessage({ tone: "error", text: `Verdantrix could not process the ${kind} file.` });
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload(kind: UploadKind, event: ChangeEvent<HTMLInputElement>) {
    await submitFile(kind, event.target.files?.[0]);
  }

  async function handleTravelSync(records?: unknown) {
    setBusy("travel");
    setMessage(null);
    try {
      const response = await syncTravel(selectedOrg, records);
      setMessage({ tone: "info", text: response.message });
      setLastSummary({
        source: "travel",
        processed_rows: response.data.processed_rows,
        created_records: response.data.created_records,
        flagged_records: response.data.flagged_records,
        rejected_records: response.data.rejected_records,
      });
      sourceState.setData(await fetchDataSources().then((result) => result.data));
    } catch (error) {
      setMessage({ tone: "error", text: "Verdantrix travel sync failed." });
    } finally {
      setBusy(null);
    }
  }

  async function handleTravelFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const contents = await file.text();
      const parsed = JSON.parse(contents) as unknown;

      if (!Array.isArray(parsed)) {
        setMessage({ tone: "error", text: "Travel sync file must be a JSON array of records." });
        return;
      }

      await handleTravelSync(parsed);
    } catch (error) {
      setMessage({ tone: "error", text: "Travel sync file could not be read. Ensure it is valid JSON." });
    }
  }

  function handleDrop(kind: UploadKind, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(null);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void submitFile(kind, file);
    }
  }

  const recentHealth = useMemo(() => {
    const runs = sourceState.data || [];
    return {
      totalRuns: runs.length,
      completed: runs.filter((item) => item.ingestion_status === "completed").length,
      failed: runs.filter((item) => item.ingestion_status === "failed").length,
    };
  }, [sourceState.data]);

  return (
    <div className="space-y-6">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Ingestion</p>
          <h1 className="workspace-title">Upload Center</h1>
          <p className="workspace-copy">
            Load source files, review ingestion outcomes, and keep the latest run summaries visible to the analyst team.
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label className="mb-2 block text-sm font-medium text-slate-700">Organization</label>
          <select className="select" value={selectedOrg} onChange={(event) => setSelectedOrg(Number(event.target.value))}>
            {(orgState.data || []).map((org: Organization) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message ? <AlertBanner message={message.text} tone={message.tone} /> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <UploadCard
          title="SAP Upload"
          description="Fuel extracts with plant mapping, unit cleanup, and source-row preservation."
          progress={progress.sap || 0}
          busy={busy === "sap"}
          active={dragging === "sap"}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging("sap");
          }}
          onDragLeave={() => setDragging(null)}
          onDrop={(event) => handleDrop("sap", event)}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CSV only</p>
          <div className="mt-4 flex gap-3">
            <label className="button-primary cursor-pointer">
              Choose SAP CSV
              <input type="file" accept=".csv" className="hidden" onChange={(event) => handleUpload("sap", event)} />
            </label>
            <span className="self-center text-sm text-slate-500">or drag and drop here</span>
          </div>
        </UploadCard>

        <UploadCard
          title="Utility Upload"
          description="Billing exports with mixed date formats, unit normalization, and anomaly checks."
          progress={progress.utility || 0}
          busy={busy === "utility"}
          active={dragging === "utility"}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging("utility");
          }}
          onDragLeave={() => setDragging(null)}
          onDrop={(event) => handleDrop("utility", event)}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CSV only</p>
          <div className="mt-4 flex gap-3">
            <label className="button-primary cursor-pointer">
              Choose Utility CSV
              <input type="file" accept=".csv" className="hidden" onChange={(event) => handleUpload("utility", event)} />
            </label>
            <span className="self-center text-sm text-slate-500">or drag and drop here</span>
          </div>
        </UploadCard>

        <UploadCard
          title="Travel Sync"
          description="Mocked sync path for booking records, with distance fallback and travel-class factors."
          progress={busy === "travel" ? 100 : 0}
          busy={busy === "travel"}
          active={false}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">JSON only</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="button-primary cursor-pointer">
              {busy === "travel" ? "Syncing..." : "Choose Travel JSON"}
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleTravelFile}
                disabled={busy === "travel"}
              />
            </label>
            <button
              type="button"
              className="button-secondary"
              onClick={() => handleTravelSync()}
              disabled={busy === "travel"}
            >
              Use sample payload
            </button>
          </div>
        </UploadCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-semibold">Ingestion Snapshot</h2>
              <p className="text-sm text-slate-500">Quick view of recent run health in this workspace.</p>
            </div>
          </div>
          <div className="panel-body grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <SummaryValue label="Total runs" value={recentHealth.totalRuns} />
            <SummaryValue label="Completed" value={recentHealth.completed} />
            <SummaryValue label="Failed" value={recentHealth.failed} tone={recentHealth.failed ? "error" : "default"} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-semibold">Latest Ingestion Summary</h2>
              <p className="text-sm text-slate-500">Processed, created, flagged, and rejected rows from the most recent run.</p>
            </div>
          </div>
          <div className="panel-body">
            {lastSummary ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryValue label={`${lastSummary.source} rows`} value={lastSummary.processed_rows} />
                <SummaryValue label="Created records" value={lastSummary.created_records} />
                <SummaryValue label="Flagged records" value={lastSummary.flagged_records} />
                <SummaryValue label="Rejected records" value={lastSummary.rejected_records} tone={lastSummary.rejected_records ? "error" : "default"} />
              </div>
            ) : (
              <EmptyState title="No ingestion summary yet" description="Run a file upload or travel sync to capture a row-level summary here." />
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="text-lg font-semibold">Recent Verdantrix Ingestion Runs</h2>
            <p className="text-sm text-slate-500">Source status, operator, method, and preserved row counts.</p>
          </div>
        </div>
        <div className="panel-body">
          {!sourceState.data?.length ? (
            <EmptyState title="No uploads yet" description="Upload SAP or utility CSV files, or run travel sync to populate Verdantrix." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-compact">
                <thead>
                  <tr>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">File</th>
                    <th className="pb-3 font-medium">Uploaded by</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Rows</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(sourceState.data || []).map((item: DataSourceSummary) => (
                    <tr key={item.id}>
                      <td className="font-medium capitalize">{item.source_type}</td>
                      <td className="text-slate-600">{item.original_file_name}</td>
                      <td className="text-slate-600">{item.uploaded_by_username || "system"}</td>
                      <td className="text-slate-600">{item.upload_method}</td>
                      <td className="text-slate-600">{item.raw_record_count}</td>
                      <td><StatusPill value={item.ingestion_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadCard({
  title,
  description,
  progress,
  busy,
  active,
  children,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  title: string;
  description: string;
  progress: number;
  busy: boolean;
  active: boolean;
  children: ReactNode;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="panel">
      <div className="panel-body">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div className={`dropzone mt-6 ${active ? "dropzone-active" : ""}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${busy ? "bg-slate-900" : "bg-slate-400"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryValue({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "error" }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${tone === "error" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
