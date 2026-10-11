import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Crosshair, Target, Search } from "lucide-react";
import api from "../lib/api";
import { SeverityBadge } from "../components/common";
import { useStream } from "../context/StreamContext";
import IncidentDrawer from "../components/IncidentDrawer";

const STATUSES = ["all", "active", "investigating", "mitigated", "dismissed"];

export default function Threats() {
  const { alerts } = useStream();
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    const url = status === "all" ? "/incidents" : `/incidents?status=${status}`;
    api.get(url).then((r) => setIncidents(r.data.items)).catch(() => {});
  }, [status]);

  useEffect(() => { load(); const id = setInterval(load, 4000); return () => clearInterval(id); }, [load, alerts.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-head uppercase tracking-wide text-slate-300">Threat Detection</span>
        <div className="flex gap-1 ml-auto">
          {STATUSES.map((s) => (
            <button key={s} data-testid={`threat-status-${s}`} onClick={() => setStatus(s)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm border ${status === s ? "border-cyan-700 bg-cyan-950/40 text-cyan-300" : "border-[#1E293B] text-slate-400"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incidents.map((inc, i) => (
          <motion.div key={inc.incident_id} data-testid={`threat-card-${inc.incident_id}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="cs-card p-4 cursor-pointer" onClick={() => setSelected(inc.incident_id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-cyan-400" />
                <span className="font-head uppercase tracking-wide text-sm">{inc.attack_name}</span>
              </div>
              <SeverityBadge severity={inc.severity} />
            </div>
            <div className="space-y-1 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><Crosshair size={12} className="text-slate-600" /> {inc.source}</div>
              <div className="flex items-center gap-1.5"><Target size={12} className="text-slate-600" /> {inc.target}</div>
              <div className="flex justify-between pt-1 text-slate-500">
                <span>obs {inc.observed} / thr {inc.threshold}</span>
                <span>{inc.alert_count} alerts</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>{new Date(inc.first_seen).toLocaleTimeString("en-GB")}</span>
                <span className="uppercase text-cyan-500">{inc.status}</span>
              </div>
            </div>
            <button data-testid={`threat-action-investigate-${inc.incident_id}`}
              className="mt-3 w-full py-1.5 text-xs font-mono uppercase border border-cyan-800/50 text-cyan-300 rounded-sm hover:bg-cyan-950/40 flex items-center justify-center gap-1">
              <Search size={12} /> Investigate
            </button>
          </motion.div>
        ))}
        {incidents.length === 0 && (
          <div className="col-span-full text-center text-slate-500 font-mono py-12">
            No incidents for this filter. Trigger an attack scenario from the header simulator.
          </div>
        )}
      </div>

      <IncidentDrawer incidentId={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}
