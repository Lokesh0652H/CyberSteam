import React from 'react';

const ServerActivity = ({ data }) => {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div style={{ width: '100%', padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
        No server data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Server Activity</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {safeData.map((server, i) => {
          const status = typeof server.status === 'object' ? (server.status?.label || server.status?.value || 'ACTIVE') : String(server.status || 'ACTIVE');
          const statusColor = status === 'ACTIVE' || status === 'ONLINE' ? 'var(--severity-low)' : 
                             status === 'MAINTENANCE' || status === 'WARNING' ? 'var(--severity-high)' : 
                             'var(--severity-critical)';
          const events = server.total_events ?? server.events ?? 0;
          const errorRate = server.error_rate ?? server.errors ?? 0;
          
          return (
            <div key={server.server_id || i} style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{server.server_id || `Server ${i+1}`}</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {server.hostname || ''} • {server.environment || ''}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Events</span>
                    <span>{Number(events).toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: `${Math.min(100, (events / Math.max(1, events)) * 100)}%`, height: '100%', background: 'var(--severity-info)', borderRadius: '2px' }} />
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Error Rate</span>
                    <span>{Number(errorRate).toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: `${Math.min(100, errorRate)}%`, height: '100%', background: errorRate > 5 ? 'var(--severity-high)' : 'var(--severity-low)', borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServerActivity;
