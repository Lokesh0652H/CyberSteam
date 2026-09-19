import React, { useState, useEffect, useCallback } from 'react';
import SeverityBadge from '../components/Common/SeverityBadge';
import ConnectionStatus from '../components/Common/ConnectionStatus';
import { useWebSocket } from '../hooks/useWebSocket';
import { Play, Pause, Trash2, Search, Radio, Filter } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const LiveEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filters, setFilters] = useState({ severity: '', type: '', ip: '', username: '' });
  
  // Realtime WebSocket stream
  const { data: latestEvent, status: connectionStatus } = useWebSocket('ws://localhost:8000/ws/events');

  useEffect(() => {
    if (latestEvent && !isPaused) {
      setEvents(prev => [latestEvent, ...prev].slice(0, 500));
    }
  }, [latestEvent, isPaused]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const filteredEvents = events.filter(e => {
    if (filters.severity && e.severity !== filters.severity) return false;
    if (filters.type && e.event_type !== filters.type) return false;
    if (filters.ip) {
      const src = e.source_ip || '';
      const dst = e.destination_ip || e.dest_ip || '';
      if (!src.includes(filters.ip) && !dst.includes(filters.ip)) return false;
    }
    if (filters.username) {
      const user = e.username || e.user || '';
      if (!user.toLowerCase().includes(filters.username.toLowerCase())) return false;
    }
    return true;
  });

  const [simulating, setSimulating] = useState('');

  const fetchRecent = async () => {
    try {
      const res = await api.getRecentEvents(50);
      if (res.data && res.data.length > 0) {
        setEvents(res.data);
      }
    } catch (e) {
      console.error("Failed to load recent events", e);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const triggerAttack = async (scenario, label) => {
    try {
      setSimulating(label);
      await api.triggerScenario(scenario);
      setTimeout(fetchRecent, 500);
      setTimeout(() => setSimulating(''), 5000);
    } catch (err) {
      console.error("Attack simulation trigger failed", err);
      setSimulating('');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio color="var(--accent)" size={24} /> Real-Time Distributed Event Stream
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Direct WebSocket push from high-throughput streaming generator & Kafka topics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <ConnectionStatus status={connectionStatus} />
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isPaused ? <Play size={14} color="var(--accent)" /> : <Pause size={14} color="var(--severity-high)" />}
            {isPaused ? 'Resume Stream' : 'Pause'}
          </button>

          <button
            onClick={clearEvents}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Live Attack Scenario Injection Ribbon */}
      <div className="card" style={{
        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', background: 'rgba(255, 51, 102, 0.06)',
        border: '1px solid rgba(255, 51, 102, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--severity-critical)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚡ Live Attack Simulator (Demo):
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {simulating ? (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{simulating} in progress... watch table below!</span>
            ) : (
              'Click an attack pattern below to inject real threat packets into the stream:'
            )}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => triggerAttack('brute_force', 'Brute Force Attack')}
            className="btn btn-sm btn-secondary"
            style={{ borderColor: 'var(--severity-critical)', color: 'var(--severity-critical)', fontSize: '0.78rem' }}
          >
            🚨 Brute Force (20 Failures)
          </button>
          <button
            onClick={() => triggerAttack('ddos', 'DDoS Request Flood')}
            className="btn btn-sm btn-secondary"
            style={{ borderColor: 'var(--severity-high)', color: 'var(--severity-high)', fontSize: '0.78rem' }}
          >
            💥 DDoS Flood (70 Req/s)
          </button>
          <button
            onClick={() => triggerAttack('port_scan', 'Firewall Port Scan')}
            className="btn btn-sm btn-secondary"
            style={{ borderColor: 'var(--severity-medium)', color: 'var(--severity-medium)', fontSize: '0.78rem' }}
          >
            🔥 Port Scan (25 Blocked)
          </button>
          <button
            onClick={() => triggerAttack('server_error_spike', 'Server 500 Spike')}
            className="btn btn-sm btn-secondary"
            style={{ borderColor: 'var(--severity-info)', color: 'var(--severity-info)', fontSize: '0.78rem' }}
          >
            ⚠️ Server 500 Crash (30 Errors)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '160px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter IP..."
            value={filters.ip}
            onChange={e => setFilters({ ...filters, ip: e.target.value })}
            className="input"
            style={{ width: '100%', paddingLeft: '32px', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ flex: '1', minWidth: '160px' }}>
          <input
            type="text"
            placeholder="Filter Username..."
            value={filters.username}
            onChange={e => setFilters({ ...filters, username: e.target.value })}
            className="input"
            style={{ width: '100%', fontSize: '0.8rem' }}
          />
        </div>

        <select
          value={filters.severity}
          onChange={e => setFilters({ ...filters, severity: e.target.value })}
          className="input"
          style={{ width: '150px', fontSize: '0.8rem' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
          <option value="INFO">INFO</option>
        </select>

        <select
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
          className="input"
          style={{ width: '160px', fontSize: '0.8rem' }}
        >
          <option value="">All Event Types</option>
          <option value="HTTP_REQUEST">HTTP_REQUEST</option>
          <option value="API_REQUEST">API_REQUEST</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
          <option value="FIREWALL_ALLOW">FIREWALL_ALLOW</option>
          <option value="FIREWALL_BLOCK">FIREWALL_BLOCK</option>
          <option value="DNS_REQUEST">DNS_REQUEST</option>
          <option value="DATABASE_ACCESS">DATABASE_ACCESS</option>
        </select>

        {(filters.ip || filters.username || filters.severity || filters.type) && (
          <button
            onClick={() => setFilters({ severity: '', type: '', ip: '', username: '' })}
            className="btn btn-ghost"
            style={{ fontSize: '0.78rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Live Events Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span>Buffer: <strong style={{ color: 'var(--text-primary)' }}>{filteredEvents.length}</strong> events in memory (Max 500)</span>
          {isPaused && <span style={{ color: 'var(--severity-high)', fontWeight: 700 }}>STREAM PAUSED</span>}
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#111620', zIndex: 2 }}>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Time</th>
                <th style={{ padding: '10px 14px' }}>Event Type</th>
                <th style={{ padding: '10px 14px' }}>Severity</th>
                <th style={{ padding: '10px 14px' }}>Source IP</th>
                <th style={{ padding: '10px 14px' }}>Destination IP</th>
                <th style={{ padding: '10px 14px' }}>User</th>
                <th style={{ padding: '10px 14px' }}>Host Server</th>
                <th style={{ padding: '10px 14px' }}>Service</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt, idx) => {
                  const src = evt.source_ip || '127.0.0.1';
                  const dst = evt.destination_ip || evt.dest_ip || '-';
                  const user = evt.username || evt.user || '-';
                  const srv = evt.server_id || evt.server || '-';
                  const status = evt.status_code || evt.status || '200';

                  return (
                    <tr
                      key={evt.event_id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        animation: idx === 0 ? 'fadeIn 0.3s ease' : 'none'
                      }}
                    >
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {formatDate(evt.timestamp || new Date().toISOString())}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                        {evt.event_type}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <SeverityBadge severity={evt.severity} />
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {src}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {dst}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                        {user}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {srv}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        {evt.service || 'http'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                        {status}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Listening for incoming streaming events from WebSocket...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveEventsPage;
