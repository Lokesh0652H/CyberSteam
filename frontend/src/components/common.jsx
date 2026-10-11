export const SEV = {
  critical: "bg-red-950/80 text-red-400 border-red-800/60",
  high: "bg-orange-950/80 text-orange-400 border-orange-800/60",
  medium: "bg-amber-950/80 text-amber-400 border-amber-800/60",
  low: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
  info: "bg-sky-950/80 text-sky-400 border-sky-800/60",
};

export const CHART_COLORS = ["#06B6D4", "#38BDF8", "#EF4444", "#F97316", "#F59E0B", "#10B981", "#8B5CF6"];

export function SeverityBadge({ severity, testid }) {
  const cls = SEV[severity] || SEV.info;
  return (
    <span data-testid={testid} className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider ${cls}`}>
      {severity}
    </span>
  );
}

export function StatusDot({ status }) {
  const c = status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${c} ${status === "online" ? "pulse-dot" : ""}`} />;
}

export function Overline({ children }) {
  return <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-1">{children}</div>;
}

export function Panel({ title, children, className = "", right }) {
  return (
    <div className={`cs-card p-4 transition-colors ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-head text-sm uppercase tracking-wide text-slate-200">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
