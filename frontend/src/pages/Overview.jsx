import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, AlertTriangle, Server, Cpu, Radio, Zap, Boxes } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../lib/api";
import { useStream } from "../context/StreamContext";
import { Panel, SeverityBadge, CHART_COLORS } from "../components/common";

const ICONS = { total_events: Boxes, events_per_sec: Activity, active_alerts: ShieldAlert, critical_alerts: AlertTriangle, affected_hosts: Server, attack_incidents: Radio, kafka_throughput: Zap, detection_latency_ms: Cpu };
const KPIS = [
  ["total_events", "Total Events"], ["events_per_sec", "Events/sec"], ["active_alerts", "Active Alerts"],
  ["critical_alerts", "Critical"], ["affected_hosts", "Hosts"], ["attack_incidents", "Incidents"],
  ["kafka_throughput", "Kafka thr/s"], ["detection_latency_ms", "CEP Latency ms"],
];

export default function Overview() {
  const { alerts, metrics, ratePoints } = useStream();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = () => {
      api.get("/statistics").then((r) => setStats(r.data)).catch(() => {});
      api.get("/analytics/summary").then((r) => setAnalytics(r.data)).catch(() => {});
    };
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const sev = stats?.severity_distribution || {};
  const sevData = Object.entries(sev).map(([k, v]) => ({ name: k, value: v }));
  const attackData = (analytics?.attack_types || []).map((a) => ({ name: a.type.replace(/_/g, " "), count: a.count }));
  const targets = (analytics?.top_targeted_hosts || []).slice(0, 7).map((t) => ({ name: t.host, alerts: t.alerts }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {KPIS.map(([key, label], i) => {
          const Icon = ICONS[key];
          const val = stats?.[key] ?? (key === "events_per_sec" ? metrics?.events_per_sec : "—");
          return (
            <motion.div key={key} data-testid={`kpi-card-${key}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="cs-card p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <Icon size={12} className="text-cyan-400" /> {label}
              </div>
              <div className="font-head text-2xl mt-1 text-slate-100">{val ?? "—"}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel title="Event Throughput (Live)" className="lg:col-span-8" right={<span className="text-[10px] font-mono text-cyan-400">events/sec · alerts</span>}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={ratePoints}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} /><stop offset="100%" stopColor="#06B6D4" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace" }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0F1522", border: "1px solid #1E293B", fontSize: 12 }} />
              <Area type="monotone" dataKey="eps" stroke="#06B6D4" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Severity Distribution" className="lg:col-span-4">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sevData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {sevData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0F1522", border: "1px solid #1E293B", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Attack Type Distribution" className="lg:col-span-7">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attackData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "monospace" }} width={140} />
              <Tooltip contentStyle={{ background: "#0F1522", border: "1px solid #1E293B", fontSize: 12 }} />
              <Bar dataKey="count" fill="#F97316" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="High-Priority Alert Ticker" className="lg:col-span-5">
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {alerts.length === 0 && <div className="text-slate-500 text-sm font-mono">No alerts yet — trigger a scenario from the header.</div>}
            {alerts.slice(0, 20).map((a) => (
              <motion.div key={a.alert_id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between border-b border-[#141C2E] pb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <SeverityBadge severity={a.severity} />
                  <span className="font-mono text-xs text-slate-300 truncate">{a.rule_name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">{a.source}</span>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
