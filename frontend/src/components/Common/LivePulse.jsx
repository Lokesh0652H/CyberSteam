import React from 'react';

const LivePulse = ({ active = false }) => {
  const color = active ? 'var(--accent)' : 'var(--severity-high)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: color,
        animation: active ? 'livePulse 2s infinite' : 'none',
      }} />
    </div>
  );
};

export default LivePulse;
