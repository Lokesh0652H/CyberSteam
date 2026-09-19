import React from 'react';

const statusStyles = {
  OPEN: { bg: 'rgba(255, 51, 102, 0.12)', color: 'var(--severity-critical)', border: 'rgba(255, 51, 102, 0.25)' },
  ACKNOWLEDGED: { bg: 'rgba(255, 184, 0, 0.12)', color: 'var(--severity-medium)', border: 'rgba(255, 184, 0, 0.25)' },
  INVESTIGATING: { bg: 'rgba(0, 170, 255, 0.12)', color: 'var(--severity-info)', border: 'rgba(0, 170, 255, 0.25)' },
  RESOLVED: { bg: 'rgba(0, 204, 136, 0.12)', color: 'var(--severity-low)', border: 'rgba(0, 204, 136, 0.25)' },
  FALSE_POSITIVE: { bg: 'rgba(90, 100, 120, 0.12)', color: 'var(--text-muted)', border: 'rgba(90, 100, 120, 0.25)' },
  ACTIVE: { bg: 'rgba(0, 255, 136, 0.1)', color: 'var(--status-active)', border: 'rgba(0, 255, 136, 0.25)' },
  INACTIVE: { bg: 'rgba(90, 100, 120, 0.12)', color: 'var(--text-muted)', border: 'rgba(90, 100, 120, 0.25)' },
  MAINTENANCE: { bg: 'rgba(255, 184, 0, 0.12)', color: 'var(--severity-medium)', border: 'rgba(255, 184, 0, 0.25)' },
  CONNECTED: { bg: 'rgba(0, 255, 136, 0.1)', color: 'var(--status-active)', border: 'rgba(0, 255, 136, 0.25)' },
  DISCONNECTED: { bg: 'rgba(255, 51, 102, 0.12)', color: 'var(--status-error)', border: 'rgba(255, 51, 102, 0.25)' },
  RECONNECTING: { bg: 'rgba(255, 184, 0, 0.12)', color: 'var(--status-warning)', border: 'rgba(255, 184, 0, 0.25)' },
  DEGRADED: { bg: 'rgba(255, 184, 0, 0.12)', color: 'var(--status-warning)', border: 'rgba(255, 184, 0, 0.25)' },
  PROCESSING: { bg: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent-secondary)', border: 'rgba(0, 212, 255, 0.25)' },
};

const defaultStyle = { bg: 'rgba(90, 100, 120, 0.12)', color: 'var(--text-secondary)', border: 'rgba(90, 100, 120, 0.25)' };

const StatusBadge = ({ status }) => {
  // Handle object or string
  let displayLabel;
  let key;

  if (typeof status === 'object' && status !== null) {
    displayLabel = status.label || status.name || 'Unknown';
    key = displayLabel.toUpperCase().replace(/\s+/g, '_');
  } else {
    displayLabel = String(status || 'Unknown');
    key = displayLabel.toUpperCase().replace(/\s+/g, '_');
  }

  const style = statusStyles[key] || defaultStyle;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
    }}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
