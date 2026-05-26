import { useEffect } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchDashboardMetrics } from "../services/api";

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Verdantrix — Dashboard";
  }, []);

  const { data, loading, error } = useAsyncData(() => fetchDashboardMetrics().then((response) => response.data), []);

  if (loading) {
    return <div className="panel"><div className="panel-body">Loading Verdantrix analytics...</div></div>;
  }

  if (error || !data) {
    return <EmptyState title="Dashboard unavailable" description={error || "No Verdantrix metrics are available yet."} />;
  }

  return (
    <div className="space-y-6">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="workspace-title">Operations Dashboard</h1>
          <p className="workspace-copy">
            Current ingestion volume, review pressure, and record quality indicators for the active organization.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total ingested rows" value={data.total_ingested_rows} />
        <MetricCard label="Flagged rows" value={data.flagged_rows} tone="flag" />
        <MetricCard label="Approved rows" value={data.approved_rows} tone="success" />
        <MetricCard label="Locked rows" value={data.locked_rows} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-semibold">Ingestion Source Breakdown</h2>
              <p className="text-sm text-slate-500">Volume by channel based on completed data source runs.</p>
            </div>
          </div>
          <div className="panel-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.source_breakdown}>
                <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
                <XAxis dataKey="source_type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-semibold">Anomaly Distribution</h2>
              <p className="text-sm text-slate-500">Current spread of low, medium, and high-risk records.</p>
            </div>
          </div>
          <div className="panel-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "low", value: data.anomaly_statistics.low },
                    { name: "medium", value: data.anomaly_statistics.medium },
                    { name: "high", value: data.anomaly_statistics.high }
                  ]}
                  dataKey="value"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={6}
                >
                  {pieColors.map((color) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="text-lg font-semibold">Validation Status</h2>
            <p className="text-sm text-slate-500">Only metrics already derived from normalized records are shown here.</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid gap-4 md:grid-cols-3">
            {data.validation_breakdown.map((item) => (
              <div key={item.validation_status} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.validation_status}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
