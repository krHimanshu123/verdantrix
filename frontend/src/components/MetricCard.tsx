interface MetricCardProps {
  label: string;
  value: number | string;
  tone?: "default" | "flag" | "success";
}

export default function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  const accent =
    tone === "flag" ? "border-amber-200 bg-amber-50/80" : tone === "success" ? "border-emerald-200 bg-emerald-50/80" : "";

  return (
    <div className={`panel ${accent}`}>
      <div className="panel-body">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="kpi-meta">Current workspace snapshot</p>
      </div>
    </div>
  );
}
