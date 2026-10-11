import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileArchive, Loader2, Check, Package } from "lucide-react";
import { API } from "../lib/api";
import api from "../lib/api";

const MODES = [
  { id: "complete", title: "Complete Project", desc: "Source code + configuration + documentation" },
  { id: "source", title: "Source Only", desc: "Frontend + backend + streaming + simulator source" },
  { id: "docs", title: "Documentation Only", desc: "README + architecture + API + technical docs" },
];

function human(b) {
  if (!b) return "—";
  const u = ["B", "KB", "MB", "GB"]; let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

export default function ExportModal({ open, onClose }) {
  const [mode, setMode] = useState("complete");
  const [size, setSize] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle|preparing|downloading|done|error
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhase("idle"); setErrMsg("");
    setSize(null);
    api.get(`/project/export/size?mode=${mode}`).then((r) => setSize(r.data)).catch(() => setSize(null));
  }, [open, mode]);

  const download = async () => {
    setPhase("preparing"); setErrMsg("");
    try {
      const token = localStorage.getItem("cs_token");
      const res = await fetch(`${API}/project/export?mode=${mode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please sign in again.");
        if (res.status === 403) throw new Error("Export permission required.");
        throw new Error("Unable to create project archive.");
      }
      setPhase("downloading");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mode === "complete" ? "cyberstream-project.zip" : `cyberstream-${mode}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setPhase("done");
    } catch (e) {
      setErrMsg(e.message || "Project export failed. Please try again.");
      setPhase("error");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div data-testid="export-modal" onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg cs-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="text-cyan-400" size={20} />
                <h2 className="font-head text-xl uppercase tracking-wide">Export CyberStream</h2>
              </div>
              <button data-testid="export-modal-close-button" onClick={onClose} className="text-slate-400 hover:text-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {MODES.map((m) => (
                <button key={m.id} data-testid={`export-mode-${m.id}`} onClick={() => setMode(m.id)}
                  className={`w-full text-left p-3 rounded-sm border transition-colors ${
                    mode === m.id ? "border-cyan-700 bg-cyan-950/30" : "border-[#1E293B] hover:border-[#2A3F5F]"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-head uppercase tracking-wide text-sm text-slate-100">{m.title}</span>
                    {mode === m.id && <Check size={16} className="text-cyan-400" />}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-slate-400 bg-[#0B0F16] border border-[#1E293B] rounded-sm p-3 mb-4">
              <div className="text-slate-500 uppercase tracking-wider mb-1">Excluded from archive</div>
              node_modules · .venv · __pycache__ · .git · build artifacts · secrets (.env)
              <div className="mt-2 flex justify-between text-slate-300">
                <span>Files: {size ? size.file_count : "calculating…"}</span>
                <span>Est. size: {size ? human(size.estimated_zip_bytes) : "calculating…"}</span>
              </div>
            </div>

            {phase === "error" && <div data-testid="export-error" className="text-red-400 text-sm font-mono mb-3">{errMsg}</div>}
            {phase === "done" && <div data-testid="export-success" className="text-emerald-400 text-sm font-mono mb-3 flex items-center gap-1"><Check size={14} /> Project exported successfully</div>}

            <button data-testid="export-download-button" onClick={download} disabled={phase === "preparing" || phase === "downloading"}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-head uppercase tracking-wider py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2">
              {phase === "preparing" && <><Loader2 size={16} className="animate-spin" /> Creating archive…</>}
              {phase === "downloading" && <><Loader2 size={16} className="animate-spin" /> Downloading…</>}
              {(phase === "idle" || phase === "done" || phase === "error") && <><FileArchive size={16} /> Download ZIP</>}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
