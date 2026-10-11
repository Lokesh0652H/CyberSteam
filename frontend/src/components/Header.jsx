import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Download, LogOut, Play, Zap, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStream } from "../context/StreamContext";
import api from "../lib/api";
import { toast } from "sonner";

const NAV = [
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "live-events", label: "Live Events", path: "/events" },
  { id: "threats", label: "Threats", path: "/threats" },
  { id: "simulator", label: "Attack Simulator", path: "/simulator" },
  { id: "analytics", label: "Analytics", path: "/analytics" },
  { id: "network-map", label: "Network Map", path: "/network" },
  { id: "rules", label: "Rules", path: "/rules" },
  { id: "system-health", label: "System", path: "/system" },
];

const RATES = [10, 50, 100, 500, 1000];
const SCENARIOS = [
  { id: "normal", label: "Normal Traffic" },
  { id: "brute_force", label: "Brute Force" },
  { id: "port_scan", label: "Port Scan" },
  { id: "distributed_brute_force", label: "Distributed Brute Force" },
  { id: "ddos_burst", label: "DDoS Burst" },
  { id: "ssh_attack", label: "SSH Attack" },
  { id: "data_exfiltration", label: "Data Exfiltration" },
  { id: "dns_anomaly", label: "DNS Anomaly" },
  { id: "multi_stage", label: "Multi-Stage Attack" },
];

export default function Header({ onExport }) {
  const { user, logout } = useAuth();
  const { connected, metrics } = useStream();
  const [simOpen, setSimOpen] = useState(false);
  const canControl = user?.role === "admin" || user?.role === "analyst";
  const canExport = canControl;

  const setRate = async (rate) => {
    try { await api.post("/simulator/rate", { rate }); toast.success(`Ingestion rate set to ${rate}/s`); }
    catch { toast.error("Rate control requires analyst/admin"); }
  };
  const runScenario = async (scenario) => {
    try {
      const { data } = await api.post("/simulator/scenario", { scenario });
      toast.success(`Injected ${data.events_queued} events → pipeline`);
    } catch { toast.error("Scenario control requires analyst/admin"); }
    setSimOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080B10]/95 backdrop-blur-md border-b border-[#1E293B]">
      <div className="px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Shield className="text-cyan-400" size={20} />
          <span className="font-head text-lg font-bold tracking-wider hidden sm:block">
            CYBER<span className="text-cyan-400">STREAM</span>
          </span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
          {NAV.map((n) => (
            <NavLink key={n.id} to={n.path} end={n.path === "/"} data-testid={`nav-tab-${n.id}`}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isActive ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/50" : "text-slate-400 hover:text-slate-100"
                }`}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div data-testid="system-status-indicator" className="hidden md:flex items-center gap-1.5 text-xs font-mono">
            <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-emerald-500 pulse-dot" : "bg-red-500"}`} />
            <span className={connected ? "text-emerald-400" : "text-red-400"}>
              {connected ? "System Healthy" : "WS Offline"}
            </span>
            {metrics && <span className="text-slate-500">· {metrics.events_per_sec}/s</span>}
          </div>

          {canControl && (
            <div className="relative hidden lg:flex items-center gap-1">
              {RATES.map((r) => (
                <button key={r} data-testid={`simulator-rate-${r}`} onClick={() => setRate(r)}
                  className="px-1.5 py-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300 border border-transparent hover:border-cyan-800/50 rounded-sm">
                  {r}/s
                </button>
              ))}
              <button data-testid="simulator-menu-button" onClick={() => setSimOpen((o) => !o)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-cyan-300 border border-cyan-800/50 rounded-sm hover:bg-cyan-950/40">
                <Zap size={12} /> Simulate <ChevronDown size={12} />
              </button>
              {simOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-9 w-56 cs-card p-2 z-50">
                  {SCENARIOS.map((s) => (
                    <button key={s.id} data-testid={`simulator-scenario-${s.id}`} onClick={() => runScenario(s.id)}
                      className="w-full text-left px-2 py-1.5 text-xs font-mono text-slate-300 hover:bg-cyan-950/40 hover:text-cyan-300 rounded-sm flex items-center gap-2">
                      <Play size={11} /> {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-sm bg-[#141C2E] text-slate-400 border border-[#1E293B]">
            {user?.role}
          </span>

          {canExport && (
            <button data-testid="export-project-button" onClick={onExport} title="Download complete project"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono uppercase tracking-wider transition-colors">
              <Download size={14} /> <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button data-testid="logout-button" onClick={logout} title="Sign out"
            className="text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
