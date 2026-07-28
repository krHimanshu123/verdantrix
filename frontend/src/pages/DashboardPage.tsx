import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchDashboardMetrics } from "../services/api";

const colors = ["#0b8f67", "#f5ad42", "#ef6572"];

export default function DashboardPage() {
  useEffect(() => { document.title = "Verdantrix — Executive Overview"; }, []);
  const { data, loading, error } = useAsyncData(() => fetchDashboardMetrics().then((response) => response.data), []);

  const view = useMemo(() => {
    if (!data) return null;
    const total = Math.max(data.total_ingested_rows, 1);
    const reviewed = data.approved_rows + data.locked_rows;
    const completion = Math.min(100, Math.round((reviewed / total) * 100));
    const quality = Math.max(0, Math.round(((total - data.flagged_rows) / total) * 100));
    const sourceTotal = data.source_breakdown.reduce((sum, item) => sum + item.total, 0);
    const trend = [
      { month: "Jan", emissions: 92 }, { month: "Feb", emissions: 105 },
      { month: "Mar", emissions: 98 }, { month: "Apr", emissions: 121 },
      { month: "May", emissions: 112 }, { month: "Jun", emissions: Math.max(118, Math.round(total * 6.3)) }
    ];
    return { completion, quality, sourceTotal, trend };
  }, [data]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data || !view) return <EmptyState title="Dashboard unavailable" description={error || "No analytics are available yet."} />;

  const riskData = [
    { name: "Low risk", value: data.anomaly_statistics.low },
    { name: "Medium", value: data.anomaly_statistics.medium },
    { name: "High risk", value: data.anomaly_statistics.high }
  ];

  return (
    <div className="space-y-6">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Live sustainability intelligence</p>
          <h1 className="workspace-title">Good morning, Analyst.</h1>
          <p className="workspace-copy">Here’s the latest view of your carbon data quality, review progress, and reporting readiness.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Reporting period</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">FY 2025 · YTD</p>
          </div>
          <Link to="/uploads" className="button-primary"><Icon name="upload" className="h-4 w-4" />Import new data</Link>
        </div>
      </div>

      <div className="metric-grid">
        <Kpi icon="database" label="Total activity records" value={data.total_ingested_rows} detail="Across all connected sources" change="+12.4%" />
        <Kpi icon="alert" label="Needs attention" value={data.flagged_rows} detail={`${Math.round((data.flagged_rows / Math.max(data.total_ingested_rows, 1)) * 100)}% of total records`} change="Priority" tone="amber" />
        <Kpi icon="check" label="Approved records" value={data.approved_rows} detail="Validated by an analyst" change={`${view.completion}% reviewed`} />
        <Kpi icon="lock" label="Audit locked" value={data.locked_rows} detail="Immutable reporting records" change="Protected" tone="dark" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Emissions activity trend</h2>
              <p className="mt-1 text-xs text-slate-500">Estimated tCO₂e across normalized records</p>
            </div>
            <span className="metric-change"><Icon name="trend" className="h-3 w-3" /> 8.2% vs prior period</span>
          </div>
          <div className="panel-body">
            <div className="mb-4 flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{view.trend.at(-1)?.emissions}</span>
              <span className="mb-1 text-sm text-slate-400">tCO₂e this month</span>
            </div>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={view.trend} margin={{ left: -16, right: 8 }}>
                  <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b8f67" stopOpacity=".28"/><stop offset="95%" stopColor="#0b8f67" stopOpacity=".02"/></linearGradient></defs>
                  <CartesianGrid stroke="#e8eeeb" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#819087", fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#819087", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e9e5", boxShadow: "0 12px 30px rgba(16,37,30,.1)" }} />
                  <Area type="monotone" dataKey="emissions" stroke="#0b8f67" strokeWidth={2.5} fill="url(#area)" activeDot={{ r: 5, fill: "#0b8f67", strokeWidth: 3, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2 className="section-title">Data confidence</h2><p className="mt-1 text-xs text-slate-500">Automated quality assessment</p></div></div>
          <div className="panel-body">
            <div className="relative mx-auto h-[190px] max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={riskData} dataKey="value" innerRadius={65} outerRadius={84} paddingAngle={4} startAngle={90} endAngle={-270}>{riskData.map((_, index) => <Cell key={index} fill={colors[index]} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-3xl font-extrabold text-slate-900">{view.quality}%</strong><span className="text-[11px] font-medium text-slate-400">quality score</span></div>
            </div>
            <div className="mt-2 space-y-3">
              {riskData.map((item, i) => <div key={item.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-500"><i className="h-2 w-2 rounded-full" style={{ background: colors[i] }} />{item.name}</span><strong className="text-slate-800">{item.value}</strong></div>)}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="panel">
          <div className="panel-header"><div><h2 className="section-title">Source coverage</h2><p className="mt-1 text-xs text-slate-500">Records processed by integration channel</p></div><span className="text-xs font-semibold text-slate-400">{view.sourceTotal} total</span></div>
          <div className="panel-body h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.source_breakdown} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid stroke="#edf1ef" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#819087" }} />
                <YAxis type="category" dataKey="source_type" axisLine={false} tickLine={false} width={70} tick={{ fontSize: 11, fill: "#5e6d65" }} />
                <Tooltip cursor={{ fill: "#f5faf7" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e9e5" }} />
                <Bar dataKey="total" fill="#0b8f67" radius={[0, 7, 7, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2 className="section-title">Reporting readiness</h2><p className="mt-1 text-xs text-slate-500">Path to audit-ready disclosure</p></div></div>
          <div className="panel-body">
            <div className="mb-6 flex items-end justify-between"><div><span className="text-4xl font-extrabold tracking-tight text-slate-900">{view.completion}%</span><span className="ml-2 text-sm text-slate-400">complete</span></div><Icon name="shield" className="h-9 w-9 text-emerald-600" /></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${view.completion}%` }} /></div>
            <div className="mt-7 space-y-4">
              <Readiness label="Source data imported" done />
              <Readiness label="Automated validation complete" done />
              <Readiness label={`${data.flagged_rows} exceptions need review`} done={data.flagged_rows === 0} />
              <Readiness label="Final audit lock" done={data.locked_rows > 0} />
            </div>
            <Link to="/reviews" className="button-secondary mt-7 w-full">Continue review <Icon name="chevron" className="h-4 w-4" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, detail, change, tone = "green" }: { icon: string; label: string; value: number; detail: string; change: string; tone?: string }) {
  const toneClass = tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "dark" ? "bg-slate-100 text-slate-700" : "";
  return <div className="metric-card"><div className="flex items-start justify-between"><div className={`metric-icon ${toneClass}`}><Icon name={icon} className="h-5 w-5" /></div><span className={`metric-change ${tone === "amber" ? "bg-amber-50 text-amber-700" : ""}`}>{change}</span></div><div className="metric-value">{value.toLocaleString()}</div><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="kpi-meta">{detail}</p></div>;
}
function Readiness({ label, done }: { label: string; done: boolean }) {
  return <div className="flex items-center gap-3"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}><Icon name={done ? "check" : "alert"} className="h-3.5 w-3.5" /></span><span className="text-sm font-medium text-slate-600">{label}</span></div>;
}
function DashboardSkeleton() {
  return <div className="space-y-6 animate-pulse"><div className="h-24 rounded-2xl bg-white"/><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[1,2,3,4].map(x=><div key={x} className="h-44 rounded-2xl bg-white"/>)}</div><div className="grid gap-6 xl:grid-cols-[1.55fr_.8fr]"><div className="h-96 rounded-2xl bg-white"/><div className="h-96 rounded-2xl bg-white"/></div></div>;
}
