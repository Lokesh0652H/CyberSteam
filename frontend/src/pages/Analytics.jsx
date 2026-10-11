import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../lib/api";
import { Panel, CHART_COLORS } from "../components/common";

export default function Analytics() {
  const [a, setA] = useState(null);

  useEffect(() => {
    const load = () => api.get("/analytics/summary").then((r) => setA(r.data)).catch(() => {});
    load(); const id = setInterval(load, 5000); return () => clearInterval(id);
  }, []);

  const proto = Object.entries(a?.protocol_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const etypes = Object.entries(a?.event_type_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const attacks = (a?.attack_types || []).map((x) => ({ name: x.type.replace(/_/g, " "), count: x.count }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <Panel title="Attack Frequency by Type" className="lg:col-span-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={attacks} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "monospace" }} />
            <Tooltip contentStyle={{ background: "#0F1522", border: "1px solid #1E293B", fontSize: 12 }} />
            <Bar dataKey="count" fill="#EF4444" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Protocol Distribution" className="lg:col-span-3">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={proto} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85}>
              {proto.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#0F1522", border: "1px solid #1E293B", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Event Type Mix" className="lg:col-span-3">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={etypes} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85}>
              {etypes.map((e, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#0F1522", border: "1px solid #1E293B", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Top Attacking Source IPs" className="lg:col-span-6">
        <table className="w-full text-xs font-mono">
          <thead className="text-slate-500 uppercase tracking-wider"><tr><th className="text-left py-1">Source IP</th><th className="text-right py-1">Alerts</th></tr></thead>
          <tbody>
            {(a?.top_source_ips || []).map((r) => (
              <tr key={r.ip} className="border-t border-[#141C2E]"><td className="py-1.5 text-slate-300">{r.ip}</td><td className="py-1.5 text-right text-orange-400">{r.count}</td></tr>
            ))}
            {(!a || a.top_source_ips.length === 0) && <tr><td colSpan={2} className="py-6 text-center text-slate-500">No attack sources yet</td></tr>}
          </tbody>
        </table>
      </Panel>

      <Panel title="Top Targeted Hosts" className="lg:col-span-6">
        <table className="w-full text-xs font-mono">
          <thead className="text-slate-500 uppercase tracking-wider"><tr><th className="text-left py-1">Host</th><th className="text-right py-1">Alerts</th><th className="text-right py-1">Events</th></tr></thead>
          <tbody>
            {(a?.top_targeted_hosts || []).map((r) => (
              <tr key={r.host} className="border-t border-[#141C2E]"><td className="py-1.5 text-slate-300">{r.host}</td><td className="py-1.5 text-right text-red-400">{r.alerts}</td><td className="py-1.5 text-right text-slate-400">{r.events}</td></tr>
            ))}
            {(!a || a.top_targeted_hosts.length === 0) && <tr><td colSpan={3} className="py-6 text-center text-slate-500">No targeted hosts yet</td></tr>}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
