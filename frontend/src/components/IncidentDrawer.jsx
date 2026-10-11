import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Clock, Target, Crosshair, ListChecks, Loader2 } from "lucide-react";
import api from "../lib/api";
import { SeverityBadge } from "./common";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function IncidentDrawer({ incidentId, onClose, onChanged }) {
  const { user } = useAuth();
  const [inc, setInc] = useState(null);
  const [loading, setLoading] = useState(false);
  const canAct = user?.role === "admin" || user?.role === "analyst";

  useEffect(() => {
    if (!incidentId) { setInc(null); return; }
    setLoading(true);
    api.get(`/incidents/${incidentId}`).then((r) => setInc(r.data)).finally(() => setLoading(false));
  }, [incidentId]);

  const setStatus = async (status) => {
    try {
      await api.put(`/incidents/${incidentId}/status?status=${status}`);
      toast.success(`Incident marked ${status}`);
      setInc((p) => ({ ...p, status }));
      onChanged?.();
    } catch { toast.error("Action requires analyst/admin"); }
  };

  return (
    <AnimatePresence>
      {incidentId && (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/60"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div data-testid="incident-details-drawer" onClick={(e) => e.stopPropagation()}
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: "tween", duration: 0.25 }}
            className="w-full max-w-xl h-full bg-[#0B0F16] border-l border-[#1E293B] overflow-y-auto">
            <div className="sticky top-0 bg-[#0B0F16] border-b border-[#1E293B] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-cyan-400" size={18} />
                <span className="font-head uppercase tracking-wide">Incident Details</span>
              </div>
              <button data-testid="incident-drawer-close-button" onClick={onClose} className="text-slate-400 hover:text-slate-100"><X size={18} /></button>
            </div>

            {loading && <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>}
            {inc && (
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-head text-2xl uppercase">{inc.attack_name}</h2>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <div className="font-mono text-xs text-slate-500">{inc.incident_id} · {inc.status}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info icon={<Crosshair size={13} />} label="Source" value={inc.source} />
                  <Info icon={<Target size={13} />} label="Target" value={inc.target} />
                  <Info icon={<Clock size={13} />} label="First Seen" value={fmt(inc.first_seen)} />
                  <Info icon={<Clock size={13} />} label="Last Seen" value={fmt(inc.last_seen)} />
                </div>

                <Section title="Triggered Rule & Evidence">
                  <div className="font-mono text-xs bg-[#0F1522] border border-[#1E293B] rounded-sm p-3 space-y-1">
                    <Row k="rule" v={inc.attack_type} />
                    <Row k="threshold" v={String(inc.threshold)} />
                    <Row k="observed" v={String(inc.observed)} />
                    <Row k="window" v={inc.window} />
                    <Row k="alert_count" v={String(inc.alert_count)} />
                  </div>
                  <pre className="mt-2 font-mono text-[11px] text-cyan-300 bg-[#0F1522] border border-[#1E293B] rounded-sm p-3 overflow-x-auto">
{JSON.stringify(inc.evidence, null, 2)}</pre>
                </Section>

                <Section title="Recommended Investigation Steps">
                  <ul className="space-y-1.5">
                    {(inc.recommended_steps || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <ListChecks size={14} className="text-cyan-400 mt-0.5 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title={`Related Alerts (${inc.related_alerts?.length || 0})`}>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {(inc.related_alerts || []).map((a) => (
                      <div key={a.alert_id} className="font-mono text-[11px] text-slate-400 flex justify-between border-b border-[#141C2E] py-1">
                        <span>{a.rule}</span><span>{fmt(a.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                {canAct && (
                  <div className="flex gap-2 pt-2">
                    <button data-testid="incident-action-investigating" onClick={() => setStatus("investigating")}
                      className="flex-1 py-2 text-xs font-mono uppercase border border-amber-800/60 text-amber-400 rounded-sm hover:bg-amber-950/40">Investigate</button>
                    <button data-testid="incident-action-mitigated" onClick={() => setStatus("mitigated")}
                      className="flex-1 py-2 text-xs font-mono uppercase border border-emerald-800/60 text-emerald-400 rounded-sm hover:bg-emerald-950/40">Mitigate</button>
                    <button data-testid="incident-action-dismissed" onClick={() => setStatus("dismissed")}
                      className="flex-1 py-2 text-xs font-mono uppercase border border-slate-700 text-slate-400 rounded-sm hover:bg-slate-800/40">Dismiss</button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fmt = (t) => { try { return new Date(t).toLocaleString("en-GB"); } catch { return t; } };
const Info = ({ icon, label, value }) => (
  <div className="bg-[#0F1522] border border-[#1E293B] rounded-sm p-2">
    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">{icon}{label}</div>
    <div className="font-mono text-sm text-slate-200 truncate">{value}</div>
  </div>
);
const Section = ({ title, children }) => (
  <div><div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-2">{title}</div>{children}</div>
);
const Row = ({ k, v }) => (
  <div className="flex justify-between"><span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span></div>
);
