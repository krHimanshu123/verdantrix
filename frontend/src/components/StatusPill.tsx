interface StatusPillProps {
  value: string;
}

const statusMap: Record<string, string> = {
  valid: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  flagged: "bg-amber-100 text-amber-700",
  processing: "bg-sky-100 text-sky-700",
  rejected: "bg-rose-100 text-rose-700",
  failed: "bg-rose-100 text-rose-700",
  pending: "bg-slate-200 text-slate-700",
  locked: "bg-slate-900 text-white"
};

export default function StatusPill({ value }: StatusPillProps) {
  return <span className={`status-pill ${statusMap[value] || "bg-slate-100 text-slate-700"}`}>{value}</span>;
}
