import React from 'react';

const TopSourceIPs = ({ data = [] }) => {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div style={{ width: '100%', padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
        No top IP statistics available
      </div>
    );
  }

  const maxCount = safeData.length > 0 ? Math.max(...safeData.map(d => d.count || 0), 1) : 1;

  return (
    <div style={{ width: '100%', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Top Source IPs</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {safeData.slice(0, 10).map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>{item.ip}</span>
                <span style={{ color: 'var(--text-muted)' }}>{item.country}</span>
              </div>
              <span style={{ color: 'var(--severity-info)', fontWeight: 500 }}>{(item.count || 0).toLocaleString()}</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${((item.count || 0) / maxCount) * 100}%`, 
                height: '100%', 
                background: 'var(--severity-info)', 
                borderRadius: '2px' 
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSourceIPs;
