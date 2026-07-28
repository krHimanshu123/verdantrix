interface StatusPillProps {
  value: string;
}

const statusMap: Record<string, string> = {
  valid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  flagged: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  processing: "bg-sky-100 text-sky-700",
  rejected: "bg-rose-100 text-rose-700",
  failed: "bg-rose-100 text-rose-700",
  pending: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  locked: "bg-slate-900 text-white"
};

export default function StatusPill({ value }: StatusPillProps) {
  return <span className={`status-pill ${statusMap[value] || "bg-slate-100 text-slate-700"}`}>{value}</span>;
}
