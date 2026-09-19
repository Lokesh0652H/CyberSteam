import React from 'react';

const ConnectionStatus = ({ status }) => {
  let color = 'var(--text-muted)';
  let label = status;
  let isPulsing = false;

  switch (status) {
    case 'CONNECTED':
      color = 'var(--severity-low)'; // usually green/blue
      isPulsing = false;
      break;
    case 'DISCONNECTED':
      color = 'var(--severity-critical)'; // red
      isPulsing = false;
      break;
    case 'RECONNECTING':
      color = 'var(--severity-high)'; // orange
      isPulsing = true;
      break;
    default:
      label = 'UNKNOWN';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
      <div 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          animation: isPulsing ? 'pulse 1.5s infinite' : 'none',
          boxShadow: isPulsing ? `0 0 8px ${color}` : 'none'
        }}
      />
      {label}
      {isPulsing && (
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
      )}
    </div>
  );
};

export default ConnectionStatus;
