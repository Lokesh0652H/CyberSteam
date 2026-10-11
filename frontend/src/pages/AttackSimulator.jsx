import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Play, Square, RotateCcw, Zap, Radio, Crosshair, Target,
  Terminal, Activity, AlertTriangle, ShieldAlert, Server, Database } from "lucide-react";
import api from "../lib/api";
import { useStream } from "../context/StreamContext";
import { Panel, SeverityBadge } from "../components/common";
import IncidentDrawer from "../components/IncidentDrawer";
import { toast } from "sonner";

const SCENARIOS = [
  { id: "brute_force", code: "01", name: "Brute Force", desc: "Repeated failed authentication against one target.",
    fields: [["source_ip", "Source IP", "10.10.10.25"], ["target_ip", "Target IP", "10.10.20.10"],
             ["username", "Username", "admin"], ["protocol", "Protocol", "SSH"], ["attempts", "Attempts", 20]] },
  { id: "port_scan", code: "02", name: "Port Scan", desc: "One source probing many destination ports.",
    fields: [["source_ip", "Attacker IP", "10.10.10.45"], ["target_ip", "Target IP", "10.10.20.15"],
             ["start_port", "Start Port", 20], ["ports", "Port Count", 20]] },
  { id: "distributed_brute_force", code: "03", name: "Distributed Brute Force", desc: "Many sources → same account.",
    fields: [["target_ip", "Target IP", "10.10.20.10"], ["username", "Username", "admin"], ["sources", "Source Count", 10]] },
  { id: "ssh_attack", code: "04", name: "SSH Attack", desc: "Repeated SSH connection attempts.",
    fields: [["source_ip", "Source IP", "10.10.10.30"], ["target_ip", "Target IP", "10.10.20.10"], ["attempts", "Attempts", 14]] },
  { id: "authentication_anomaly", code: "05", name: "Auth Anomaly", desc: "failed → failed → success sequence.",
    fields: [["source_ip", "Source IP", "10.10.10.60"], ["target_ip", "Target IP", "10.10.20.10"], ["fails", "Failures", 3]] },
  { id: "data_exfiltration", code: "06", name: "Data Exfiltration", desc: "Large synthetic outbound transfer.",
    fields: [["source_ip", "Source IP", "10.10.20.15"], ["target_ip", "Destination IP", "10.10.30.50"], ["mb", "Outbound MB", 850]] },
  { id: "dns_anomaly", code: "07", name: "DNS Anomaly", desc: "High-frequency queries to .test domains.",
    fields: [["source_ip", "Client IP", "10.10.20.22"], ["queries", "Query Count", 26]] },
  { id: "multi_stage", code: "08", name: "Multi-Stage Attack", desc: "Recon → auth → success → exfiltration.",
    fields: [["source_ip", "Attacker IP", "10.10.10.99"], ["target_ip", "Target IP", "10.10.20.10"]] },
];

export default function AttackSimulator() {
  const { events, alerts } = useStream();
  const [selected, setSelected] = useState(SCENARIOS[0]);
  const [cfg, setCfg] = useState({});
  const [state, setState] = useState(null);
  const [drawerId, setDrawerId] = useState(null);
  const termRef = useRef(null);

  useEffect(() => {
    const init = {};
    selected.fields.forEach(([k, , d]) => (init[k] = d));
    setCfg(init);
  }, [selected]);

  useEffect(() => {
    const load = () => api.get("/simulator/state").then((r) => setState(r.data)).catch(() => {});
    load(); const id = setInterval(load, 1000); return () => clearInterval(id);
  }, []);

  const simEvents = useMemo(() => events.filter((e) => e.simulation), [events]);
  const simAlerts = useMemo(() => alerts.filter((a) => a.simulation), [alerts]);

  useEffect(() => { if (termRef.current) termRef.current.scrollTop = 0; }, [simEvents.length]);

  const launch = async (scenario, config) => {
    try {
      const { data } = await api.post("/simulator/attack", { scenario, config: config || {} });
      toast.success(`Launched ${scenario.replace(/_/g, " ")} — ${data.events_queued} events → pipeline`);
    } catch { toast.error("Launch requires analyst/admin role"); }
  };
  const runFullDemo = async () => {
    try { await api.post("/simulator/demo/full", { step_seconds: 6 }); toast.success("SOC demonstration sequence started"); }
    catch { toast.error("Demo requires analyst/admin role"); }
  };
  const stop = async () => { try { await api.post("/simulator/stop"); toast("Pipeline stopped"); } catch {} };
  const reset = async () => {
    try { const { data } = await api.post("/simulator/reset");
      toast.success(`Reset — cleared ${data.cleared_alerts} alerts, ${data.cleared_incidents} incidents`); }
    catch { toast.error("Reset requires analyst/admin role"); }
  };

  const timeline = useMemo(() => {
    const evs = simEvents.slice(0, 40).map((e) => ({ t: e.timestamp, label: e.event_type.toUpperCase() + " " + (e.action || ""), kind: "event", key: e.event_id }));
    const als = simAlerts.slice(0, 20).map((a) => ({ t: a.timestamp, label: a.rule, kind: "alert", sev: a.severity, key: a.alert_id }));
    return [...evs, ...als].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 40);
  }, [simEvents, simAlerts]);

  const running = state?.status === "running";

  return (
    <div className="space-y-4">
      {/* header banner */}
      <div className="cs-card p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#7C2D12" }}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-orange-500" size={22} />
          <div>
            <div className="font-head text-xl uppercase tracking-wider">CYBERSTREAM <span className="text-orange-500">/ ATTACK SIMULATION LAB</span></div>
            <div className="font-mono text-[11px] text-slate-500">Synthetic events only · reserved 10.10.0.0/16 addresses · no real systems targeted</div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-1 rounded-sm bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">SIMULATION ENVIRONMENT</span>
          <span className="px-2 py-1 rounded-sm bg-sky-950/60 text-sky-400 border border-sky-800/50">SAFE / ISOLATED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* scenario selector + config */}
        <div className="lg:col-span-4 space-y-3">
          <Panel title="Attack Scenarios">
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
              {SCENARIOS.map((s) => (
                <button key={s.id} data-testid={`sim-scenario-${s.id}`} onClick={() => setSelected(s)}
                  className={`w-full text-left p-2.5 rounded-sm border transition-colors ${selected.id === s.id ? "border-orange-700 bg-orange-950/20" : "border-[#1E293B] hover:border-[#2A3F5F]"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-head uppercase tracking-wide text-sm">{s.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">SCN-{s.code}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{s.desc}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={`Configure — ${selected.name}`}>
            <div className="space-y-2">
              {selected.fields.map(([k, label, def]) => (
                <div key={k}>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</label>
                  <input data-testid={`sim-config-${k}`} value={cfg[k] ?? ""} onChange={(e) => setCfg((c) => ({ ...c, [k]: e.target.value }))}
                    className="w-full mt-0.5 bg-[#0B0F16] border border-[#1E293B] rounded-sm px-2 py-1.5 text-sm font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none" />
                </div>
              ))}
              <button data-testid="sim-launch-button" onClick={() => launch(selected.id, cfg)}
                className="w-full mt-2 bg-orange-600 hover:bg-orange-500 text-white font-head uppercase tracking-wider py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2">
                <Crosshair size={15} /> Launch Attack
              </button>
            </div>
          </Panel>
        </div>

        {/* live terminal + timeline */}
        <div className="lg:col-span-5 space-y-3">
          <Panel title="Live Security Event Stream" right={<span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400"><Radio size={11} className="pulse-dot" /> WEBSOCKET</span>}>
            <div ref={termRef} data-testid="sim-event-terminal" className="h-[260px] overflow-y-auto font-mono text-[11px] bg-black rounded-sm p-3 border border-[#141C2E]">
              {simEvents.length === 0 && <div className="text-slate-600">// awaiting simulated events — launch a scenario…</div>}
              {simEvents.slice(0, 60).map((e) => (
                <motion.div key={e.event_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-1.5 leading-tight">
                  <span className="text-slate-500">{new Date(e.timestamp).toLocaleTimeString("en-GB")}.{String(new Date(e.timestamp).getMilliseconds()).padStart(3, "0")}</span>
                  {"  "}<span className="text-orange-400">{e.event_type.toUpperCase()}{e.action ? "/" + e.action.toUpperCase() : ""}</span>
                  {"  "}<span className="text-cyan-400">SRC</span> {e.source_ip} <span className="text-cyan-400">DST</span> {e.destination_ip}:{e.destination_port} <span className="text-slate-600">{e.protocol}</span>
                </motion.div>
              ))}
            </div>
          </Panel>

          <Panel title="Live Attack Timeline">
            <div className="max-h-[180px] overflow-y-auto space-y-1">
              {timeline.length === 0 && <div className="text-slate-600 font-mono text-xs">// timeline empty</div>}
              {timeline.map((t) => (
                <div key={t.key} className="flex items-center gap-2 font-mono text-[11px] border-b border-[#141C2E] pb-1">
                  <span className="text-slate-500">{new Date(t.t).toLocaleTimeString("en-GB")}</span>
                  {t.kind === "alert"
                    ? <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={11} /> {t.label} <SeverityBadge severity={t.sev} /></span>
                    : <span className="text-slate-300">{t.label}</span>}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* control panel + status + network */}
        <div className="lg:col-span-3 space-y-3">
          <Panel title="Attack Status">
            <div className="space-y-1.5 font-mono text-xs">
              <Row k="Status" v={<span className={running ? "text-emerald-400" : "text-slate-400"}>● {(state?.status || "idle").toUpperCase()}</span>} />
              <Row k="Scenario" v={(state?.scenario || "—").toUpperCase()} />
              <Row k="Phase" v={state?.phase || "—"} />
              <Row k="Generated" v={state?.events_generated ?? 0} />
              <Row k="Processed" v={state?.events_processed ?? 0} />
              <Row k="Alerts" v={<span className="text-orange-400">{state?.alerts ?? 0}</span>} />
              <Row k="Incidents" v={<span className="text-red-400">{state?.incidents ?? 0}</span>} />
              <Row k="Elapsed" v={`${state?.elapsed ?? 0}s`} />
              <Row k="Events/sec" v={state?.metrics?.events_per_sec ?? 0} />
              <Row k="Latency" v={`${state?.metrics?.detection_latency_ms ?? 0} ms`} />
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              <Ctrl testid="sim-ctrl-stop" onClick={stop} icon={<Square size={13} />} label="Stop" />
              <Ctrl testid="sim-ctrl-reset" onClick={reset} icon={<RotateCcw size={13} />} label="Reset" />
              <Ctrl testid="sim-ctrl-clear" onClick={reset} icon={<RotateCcw size={13} />} label="Clear" />
            </div>
          </Panel>

          <Panel title="Attack Path">
            <NetworkPath active={running} />
          </Panel>
        </div>
      </div>

      {/* demo mode */}
      <Panel title="Demonstration Mode">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button key={s.id} data-testid={`sim-demo-${s.id}`} onClick={() => launch(s.id, {})}
              className="px-3 py-1.5 text-xs font-mono uppercase border border-[#1E293B] rounded-sm text-slate-300 hover:border-orange-700 hover:text-orange-300 transition-colors">
              {s.name}
            </button>
          ))}
          <button data-testid="sim-run-full-demo" onClick={runFullDemo}
            className="ml-auto px-5 py-1.5 text-xs font-head uppercase tracking-wider bg-red-700 hover:bg-red-600 text-white rounded-sm flex items-center gap-2 transition-colors">
            <Zap size={14} /> Run SOC Demonstration
          </button>
        </div>
      </Panel>

      {/* recent sim alerts */}
      <Panel title="Detected Threats (this simulation)">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {simAlerts.length === 0 && <div className="text-slate-600 font-mono text-xs col-span-full">// no detections yet</div>}
          {simAlerts.slice(0, 9).map((a) => (
            <button key={a.alert_id} data-testid={`sim-alert-${a.alert_id}`} onClick={() => setDrawerId(a.incident_id)}
              className="text-left cs-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-head uppercase tracking-wide text-sm">{a.rule_name}</span>
                <SeverityBadge severity={a.severity} />
              </div>
              <div className="font-mono text-[11px] text-slate-400">obs {a.observed} / thr {a.threshold} · {a.window}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-1">{a.source} → {a.target}</div>
            </button>
          ))}
        </div>
      </Panel>

      <IncidentDrawer incidentId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between"><span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span></div>
);
const Ctrl = ({ testid, onClick, icon, label }) => (
  <button data-testid={testid} onClick={onClick}
    className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-mono uppercase border border-[#1E293B] rounded-sm text-slate-300 hover:border-cyan-800 hover:text-cyan-300 transition-colors">
    {icon}{label}
  </button>
);

function NetworkPath({ active }) {
  const nodes = [
    { icon: <Crosshair size={16} />, label: "ATTACKER", ip: "10.10.10.x" },
    { icon: <Radio size={16} />, label: "ROUTER", ip: "10.10.0.1" },
    { icon: <Server size={16} />, label: "TARGET", ip: "10.10.20.x" },
    { icon: <Database size={16} />, label: "DATABASE", ip: "10.10.30.x" },
  ];
  return (
    <div className="flex flex-col items-center gap-1.5">
      {nodes.map((n, i) => (
        <div key={n.label} className="w-full">
          <div className={`flex items-center gap-2 p-2 rounded-sm border ${active ? "border-orange-700/60 bg-orange-950/20" : "border-[#1E293B]"}`}>
            <span className={active ? "text-orange-400" : "text-slate-500"}>{n.icon}</span>
            <div className="font-mono text-[11px]"><div className="text-slate-200">{n.label}</div><div className="text-slate-500 text-[10px]">{n.ip}</div></div>
          </div>
          {i < nodes.length - 1 && <div className={`mx-auto w-px h-3 ${active ? "bg-orange-600 pulse-dot" : "bg-[#1E293B]"}`} />}
        </div>
      ))}
    </div>
  );
}
