import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Cpu, Radio, Server, Boxes, ArrowRight, Activity } from "lucide-react";
import api from "../lib/api";
import { Panel, StatusDot } from "../components/common";

const PIPELINE = [
  { id: "sources", label: "Event Sources", icon: Boxes },
  { id: "kafka", label: "Kafka Topics", icon: Radio, svc: "kafka" },
  { id: "spark", label: "Spark CEP", icon: Cpu, svc: "spark" },
  { id: "database", label: "Postgres / Mongo (Hot)", icon: Database, svc: "database" },
  { id: "websocket", label: "WebSocket", icon: Activity, svc: "websocket" },
  { id: "api", label: "FastAPI", icon: Server, svc: "api" },
];

function human(b) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"]; let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

export default function SystemHealth() {
  const [h, setH] = useState(null);

  useEffect(() => {
    const load = () => api.get("/system/health").then((r) => setH(r.data)).catch(() => {});
    load(); const id = setInterval(load, 3000); return () => clearInterval(id);
  }, []);

  const svc = h?.services || {};
  const m = h?.metrics || {};

  return (
    <div className="space-y-4">
      <Panel title="Data Pipeline">
        <div className="flex flex-wrap items-center gap-2">
          {PIPELINE.map((p, i) => {
            const Icon = p.icon;
            const st = p.svc ? svc[p.svc] : "online";
            return (
              <div key={p.id} className="flex items-center gap-2">
                <div className="cs-card px-3 py-2 flex items-center gap-2 min-w-[140px]">
                  <Icon size={15} className="text-cyan-400" />
                  <div>
                    <div className="text-xs font-mono text-slate-200">{p.label}</div>
                    {p.svc && <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500"><StatusDot status={st} /> {st}</div>}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && <ArrowRight size={14} className="text-slate-600" />}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(svc).map(([k, v]) => (
          <motion.div key={k} data-testid={`system-service-${k}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cs-card p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{k}</div>
            <div className="flex items-center gap-2 mt-1">
              <StatusDot status={v} />
              <span className={`font-head uppercase text-sm ${v === "online" ? "text-emerald-400" : v === "degraded" ? "text-amber-400" : "text-red-400"}`}>{v}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Live Metrics">
          <div className="grid grid-cols-2 gap-3 font-mono text-sm">
            <Metric label="Events Received" value={m.events_received} />
            <Metric label="Events Processed" value={m.events_processed} />
            <Metric label="Events Rejected" value={m.events_rejected} />
            <Metric label="Alerts Generated" value={m.alerts_generated} />
            <Metric label="Events / sec" value={m.events_per_sec} />
            <Metric label="CEP Latency (ms)" value={m.detection_latency_ms} />
            <Metric label="WS Clients" value={m.ws_clients} />
            <Metric label="Queue Depth" value={h?.queue_depth} />
          </div>
        </Panel>
        <Panel title="Storage">
          <div className="grid grid-cols-2 gap-3 font-mono text-sm">
            <Metric label="Cold (Parquet)" value={human(h?.cold_storage_bytes)} />
            <Metric label="Parquet Files" value={h?.cold_files} />
            <Metric label="Started At" value={h?.started_at ? new Date(h.started_at).toLocaleTimeString("en-GB") : "—"} />
            <Metric label="Last Batch" value={m.last_batch_ts ? new Date(m.last_batch_ts).toLocaleTimeString("en-GB") : "—"} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

const Metric = ({ label, value }) => (
  <div className="bg-[#0B0F16] border border-[#141C2E] rounded-sm p-2">
    <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-lg text-cyan-300">{value ?? "—"}</div>
  </div>
);
