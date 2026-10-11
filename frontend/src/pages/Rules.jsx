import { useEffect, useState } from "react";
import { Sliders } from "lucide-react";
import api from "../lib/api";
import { Panel, SeverityBadge } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Rules() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const canEdit = user?.role === "admin";

  const load = () => api.get("/rules").then((r) => setRules(r.data.items)).catch(() => {});
  useEffect(() => { load(); }, []);

  const patch = async (id, body) => {
    try {
      const { data } = await api.put(`/rules/${id}`, body);
      setRules((rs) => rs.map((r) => (r.id === id ? data : r)));
      toast.success(`Rule ${id} updated`);
    } catch { toast.error("Rule editing requires admin"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sliders size={16} className="text-cyan-400" />
        <span className="font-head uppercase tracking-wide text-slate-300">CEP Rule Engine Configuration</span>
        {!canEdit && <span className="text-[10px] font-mono text-amber-400 ml-2">read-only — admin required to edit</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => (
          <div key={r.id} className="cs-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-head uppercase tracking-wide text-slate-100">{r.name}</div>
                <div className="font-mono text-[10px] text-cyan-500">{r.id}</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input data-testid={`rule-toggle-${r.id}`} type="checkbox" checked={r.enabled} disabled={!canEdit}
                  onChange={(e) => patch(r.id, { enabled: e.target.checked })} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{r.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500">Threshold</label>
                <input data-testid={`rule-threshold-input-${r.id}`} type="number" defaultValue={r.threshold} disabled={!canEdit}
                  onBlur={(e) => canEdit && Number(e.target.value) !== r.threshold && patch(r.id, { threshold: Number(e.target.value) })}
                  className="w-full mt-0.5 bg-[#0B0F16] border border-[#1E293B] rounded-sm px-2 py-1 text-sm font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500">Window (s)</label>
                <input data-testid={`rule-window-input-${r.id}`} type="number" defaultValue={r.window_seconds} disabled={!canEdit}
                  onBlur={(e) => canEdit && Number(e.target.value) !== r.window_seconds && patch(r.id, { window_seconds: Number(e.target.value) })}
                  className="w-full mt-0.5 bg-[#0B0F16] border border-[#1E293B] rounded-sm px-2 py-1 text-sm font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-60" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#141C2E]">
              <SeverityBadge severity={r.base_severity} />
              <span className="font-mono text-[10px] text-slate-500">matches: <span className="text-cyan-400">{r.matches ?? 0}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
