import React from 'react';
import ConnectionStatus from '../Common/ConnectionStatus';

const PipelineNode = ({ name, status, icon: Icon, metrics }) => {
  const isProcessing = status === 'PROCESSING';
  
  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      boxShadow: isProcessing ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'var(--glass-shadow)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '16px',
      width: '240px',
      position: 'relative',
      transition: 'all 0.3s ease',
      animation: isProcessing ? 'borderGlow 2s infinite' : 'none'
    }}>
      {isProcessing && (
        <style>{`
          @keyframes borderGlow {
            0% { border-color: rgba(59, 130, 246, 0.3); }
            50% { border-color: rgba(59, 130, 246, 0.8); }
            100% { border-color: rgba(59, 130, 246, 0.3); }
          }
        `}</style>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && <div style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '8px' }}><Icon size={18} /></div>}
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</h4>
        </div>
        <ConnectionStatus status={status} />
      </div>

      {metrics && metrics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'var(--font-mono, monospace)' }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PipelineNode;
