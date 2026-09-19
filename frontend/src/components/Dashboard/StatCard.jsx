import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorMap = {
  critical: 'var(--severity-critical)',
  high: 'var(--severity-high)',
  medium: 'var(--severity-medium)',
  low: 'var(--severity-low)',
  info: 'var(--severity-info)',
  accent: 'var(--accent)',
};

const StatCard = ({ title, metric, icon, color = 'accent' }) => {
  const val = metric?.current_value ?? 0;
  const prev = metric?.previous_value ?? 0;
  const trend = metric?.trend || 'stable';

  let TrendIcon = Minus;
  let trendColor = 'var(--text-muted)';
  
  if (trend === 'up') {
    TrendIcon = TrendingUp;
    trendColor = 'var(--severity-high)';
  } else if (trend === 'down') {
    TrendIcon = TrendingDown;
    trendColor = 'var(--severity-low)';
  }

  const accentColor = colorMap[color] || color;
  const pctChange = prev > 0 ? Math.abs(((val - prev) / prev) * 100).toFixed(1) : '0.0';

  const formatValue = (v) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(1);
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      borderTop: `3px solid ${accentColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all var(--transition-base)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = accentColor;
      e.currentTarget.style.boxShadow = `0 0 24px ${accentColor}22`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--glass-border)';
      e.currentTarget.style.borderTopColor = accentColor;
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Glow background */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: `${accentColor}08`,
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {title}
        </span>
        {icon && (
          <div style={{
            width: 34, height: 34,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${accentColor}12`,
            color: accentColor,
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{
        fontSize: '1.8rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        lineHeight: 1.1,
        fontFeatureSettings: '"tnum"',
      }}>
        {formatValue(val)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: trendColor }}>
          <TrendIcon size={13} />
          <span>{pctChange}%</span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {metric?.last_updated || 'just now'}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
