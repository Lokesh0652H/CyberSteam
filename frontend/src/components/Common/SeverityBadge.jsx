import React from 'react';
import { SEVERITY_LEVELS } from '../../utils/constants';

const severityStyles = {
  CRITICAL: { bg: 'var(--severity-critical-bg)', color: 'var(--severity-critical)', border: 'rgba(255, 51, 102, 0.25)' },
  HIGH: { bg: 'var(--severity-high-bg)', color: 'var(--severity-high)', border: 'rgba(255, 107, 53, 0.25)' },
  MEDIUM: { bg: 'var(--severity-medium-bg)', color: 'var(--severity-medium)', border: 'rgba(255, 184, 0, 0.25)' },
  LOW: { bg: 'var(--severity-low-bg)', color: 'var(--severity-low)', border: 'rgba(0, 204, 136, 0.25)' },
  INFO: { bg: 'var(--severity-info-bg)', color: 'var(--severity-info)', border: 'rgba(0, 170, 255, 0.25)' },
};

const SeverityBadge = ({ severity, level }) => {
  // Accept either severity or level prop, handle string or object
  let raw = severity || level || 'INFO';
  let displayLabel;
  
  if (typeof raw === 'object' && raw !== null) {
    displayLabel = raw.label || raw.name || 'INFO';
    // Try to find matching key
    const key = Object.keys(SEVERITY_LEVELS).find(k => SEVERITY_LEVELS[k] === raw);
    raw = key || displayLabel.toUpperCase();
  } else {
    raw = String(raw).toUpperCase();
    displayLabel = raw;
  }

  const style = severityStyles[raw] || severityStyles.INFO;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
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

export default SeverityBadge;
