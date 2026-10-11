import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEMO = [
  { role: "ADMIN", email: "admin@cyberstream.io", pw: "admin123" },
  { role: "ANALYST", email: "analyst@cyberstream.io", pw: "analyst123" },
  { role: "VIEWER", email: "viewer@cyberstream.io", pw: "viewer123" },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@cyberstream.io");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await login(email, password);
    if (!r.ok) setErr(r.error);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at top, #0B1420, #080B10 60%)" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-md cs-card p-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-cyan-400" size={26} />
          <span className="font-head text-2xl font-bold tracking-wider">CYBER<span className="text-cyan-400">STREAM</span></span>
        </div>
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-1">Security Operations Center</div>
        <p className="text-slate-400 text-sm mb-6">Authenticate to access the SOC console.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Email</label>
            <input data-testid="login-email-input" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-[#0B0F16] border border-[#1E293B] rounded-sm px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Password</label>
            <input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-[#0B0F16] border border-[#1E293B] rounded-sm px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
          </div>
          {err && <div data-testid="login-error" className="text-red-400 text-sm font-mono">{err}</div>}
          <button data-testid="login-submit-button" disabled={busy}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-head uppercase tracking-wider py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" />} Sign In
          </button>
        </form>
        <div className="mt-6 pt-4 border-t border-[#1E293B]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">Demo accounts</div>
          <div className="space-y-1">
            {DEMO.map((d) => (
              <button key={d.role} data-testid={`demo-login-${d.role.toLowerCase()}`}
                onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                className="w-full text-left text-xs font-mono text-slate-400 hover:text-cyan-400 flex justify-between">
                <span className="text-cyan-500">{d.role}</span><span>{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
