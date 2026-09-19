import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import StatusBadge from '../components/Common/StatusBadge';
import SeverityBadge from '../components/Common/SeverityBadge';
import * as api from '../api/endpoints';
import { Server, Activity, AlertTriangle, Cpu, HardDrive, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ServerAnalyticsPage = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [serverDetails, setServerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const res = await api.getServers();
      const serverList = res.data || [];
      setServers(serverList);
      if (serverList.length > 0 && !selectedServer) {
        loadServerDetails(serverList[0].server_id);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch server telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadServerDetails = async (serverId) => {
    setSelectedServer(serverId);
    try {
      setLoadingDetails(true);
      const res = await api.getServerDetails(serverId);
      setServerDetails(res.data);
    } catch (e) {
      console.error("Failed to load server details", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading && servers.length === 0) return <LoadingSpinner message="Loading Server Telemetry..." />;
  if (error && servers.length === 0) return <ErrorState message={error} onRetry={fetchServers} />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server color="var(--accent)" size={24} /> Infrastructure & Server Analytics
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time server telemetry, traffic volume, error rates, and security health
          </p>
        </div>
        <button onClick={fetchServers} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Server Cards Grid */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {servers.map(server => {
          const isSelected = selectedServer === server.server_id;
          const totalEvt = server.total_events || 0;
          const errRate = server.error_rate || 0;

          return (
            <div
              key={server.server_id}
              onClick={() => loadServerDetails(server.server_id)}
              className="card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                background: isSelected ? 'rgba(0, 255, 136, 0.04)' : 'var(--bg-card)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} color={isSelected ? 'var(--accent)' : 'var(--text-secondary)'} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{server.server_id}</span>
                </div>
                <StatusBadge status={server.status} />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                {server.hostname} • {server.environment}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Events:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{totalEvt.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Error Rate:</span>
                  <span style={{ color: errRate > 5 ? 'var(--severity-high)' : 'var(--severity-low)', fontWeight: 600 }}>
                    {errRate}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Active Alerts:</span>
                  <span style={{ color: (server.alert_count || 0) > 0 ? 'var(--severity-critical)' : 'var(--text-muted)' }}>
                    {server.alert_count || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Avg Response:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {server.avg_response_time || 0} ms
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Server Deep Dive */}
      {selectedServer && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--accent)" /> Detailed Telemetry: {selectedServer}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hostname: {serverDetails?.hostname} | OS: {serverDetails?.os_type || 'Linux'} | Status: {serverDetails?.status}
              </span>
            </div>
            {loadingDetails && <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Updating metrics...</span>}
          </div>

          {/* Charts Row */}
          <div className="grid-2">
            {/* Event Distribution BarChart */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Event Type Breakdown</h4>
              {serverDetails?.event_types && serverDetails.event_types.length > 0 ? (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serverDetails.event_types}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="type" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#111620', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                      <Bar dataKey="count" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No event distribution data yet for this server.
                </div>
              )}
            </div>

            {/* Hourly Activity Timeline */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hourly Event Rate</h4>
              {serverDetails?.timeline && serverDetails.timeline.length > 0 ? (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={serverDetails.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} tickFormatter={val => val.slice(11, 16)} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#111620', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                      <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="rgba(0, 255, 136, 0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Awaiting traffic aggregation timeline.
                </div>
              )}
            </div>
          </div>

          {/* Recent Alerts Table for this Server */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Server Security Alerts</h4>
            {serverDetails?.recent_alerts && serverDetails.recent_alerts.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Alert ID</th>
                      <th style={{ padding: '8px 12px' }}>Rule</th>
                      <th style={{ padding: '8px 12px' }}>Severity</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serverDetails.recent_alerts.map(a => (
                      <tr key={a.alert_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{a.alert_id}</td>
                        <td style={{ padding: '8px 12px' }}>{a.rule_name}</td>
                        <td style={{ padding: '8px 12px' }}><SeverityBadge severity={a.severity} /></td>
                        <td style={{ padding: '8px 12px' }}><StatusBadge status={a.status} /></td>
                        <td style={{ padding: '8px 12px' }}>{a.event_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(0, 255, 136, 0.05)', borderRadius: 'var(--radius-sm)', color: 'var(--severity-low)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} /> No active alerts triggered against {selectedServer}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerAnalyticsPage;
