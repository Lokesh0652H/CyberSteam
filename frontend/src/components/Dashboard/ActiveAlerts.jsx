import React from 'react';
import { useNavigate } from 'react-router-dom';
import SeverityBadge from '../Common/SeverityBadge';

const ActiveAlerts = ({ alerts }) => {
  const navigate = useNavigate();

  return (
    <div style={{ width: '100%', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Recent Alerts</h3>
        <button 
          onClick={() => navigate('/alerts')}
          style={{ background: 'none', border: 'none', color: 'var(--severity-info)', fontSize: '12px', cursor: 'pointer' }}
        >
          View All
        </button>
      </div>
      
      {(!alerts || alerts.length === 0) ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active alerts
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {alerts.slice(0, 5).map((alert, i) => (
            <div 
              key={i}
              onClick={() => navigate(`/alerts/${alert.id || i}`)}
              style={{
                padding: '12px 16px',
                borderBottom: i < alerts.length - 1 ? '1px solid var(--border-primary)' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--glass-bg)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ marginTop: '2px' }}>
                <SeverityBadge severity={alert.severity || 'MEDIUM'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.rule_name || 'Unknown Rule'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0, marginLeft: '8px' }}>
                    {alert.time || 'Just now'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{alert.source}</span>
                  <span>{alert.event_count} events</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveAlerts;
