import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Pause, Play, Copy } from "lucide-react";
import { useStream } from "../context/StreamContext";
import { SeverityBadge } from "../components/common";
import { toast } from "sonner";

const SEVS = ["all", "critical", "high", "medium", "low"];
const PAGE = 25;

export default function LiveEvents() {
  const { events } = useStream();
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState([]);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");
  const [page, setPage] = useState(1);

  const source = frozen ? snapshot : events;
  const filtered = useMemo(() => {
    return source.filter((e) => {
      if (sev !== "all" && e.severity !== sev) return false;
      if (q) {
        const hay = `${e.source_ip} ${e.destination_ip} ${e.event_id} ${e.event_type} ${e.device_id}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [source, sev, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  const toggleFreeze = () => {
    if (!frozen) setSnapshot(events);
    setFrozen((f) => !f);
  };
  const copy = (t) => { navigator.clipboard?.writeText(t); toast.success("Copied " + t); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input data-testid="live-event-search-input" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search IP, event ID, host, type…"
            className="w-full bg-[#0B0F16] border border-[#1E293B] rounded-sm pl-8 pr-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
        </div>
        <select data-testid="live-event-severity-filter" value={sev} onChange={(e) => { setSev(e.target.value); setPage(1); }}
          className="bg-[#0B0F16] border border-[#1E293B] rounded-sm px-3 py-2 text-sm font-mono focus:outline-none">
          {SEVS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
        <button data-testid="live-event-freeze-button" onClick={toggleFreeze}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase border border-[#1E293B] rounded-sm text-slate-300 hover:border-cyan-800">
          {frozen ? <><Play size={13} /> Resume</> : <><Pause size={13} /> Freeze</>}
        </button>
        <span className="text-xs font-mono text-slate-500">{filtered.length} events</span>
      </div>

      <div className="cs-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#0B0F16] text-slate-500 uppercase tracking-wider">
              <tr>
                {["Time", "Source IP", "Dest IP", "Proto", "Type", "Port", "Severity", "Status"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <motion.tr key={e.event_id} data-testid={`live-event-row-${e.event_id}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-t border-[#141C2E] hover:bg-[#141C2E]/40">
                  <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString("en-GB")}</td>
                  <td className="px-3 py-1.5 text-slate-300">
                    <button onClick={() => copy(e.source_ip)} className="flex items-center gap-1 hover:text-cyan-400">{e.source_ip}<Copy size={10} className="opacity-40" /></button>
                  </td>
                  <td className="px-3 py-1.5 text-slate-400">{e.destination_ip}</td>
                  <td className="px-3 py-1.5 text-slate-400">{e.protocol}</td>
                  <td className="px-3 py-1.5 text-cyan-400">{e.event_type}</td>
                  <td className="px-3 py-1.5 text-slate-400">{e.destination_port}</td>
                  <td className="px-3 py-1.5"><SeverityBadge severity={e.severity} /></td>
                  <td className="px-3 py-1.5 text-slate-500">{e.action}</td>
                </motion.tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">Waiting for live events…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-[#1E293B] rounded-sm disabled:opacity-40">Prev</button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-[#1E293B] rounded-sm disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
