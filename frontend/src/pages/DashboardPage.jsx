import React, { useState, useEffect } from 'react';
import StatCard from '../components/Dashboard/StatCard';
import EventTimeline from '../components/Dashboard/EventTimeline';
import ThreatDistribution from '../components/Dashboard/ThreatDistribution';
import TopSourceIPs from '../components/Dashboard/TopSourceIPs';
import ActiveAlerts from '../components/Dashboard/ActiveAlerts';
import ServerActivity from '../components/Dashboard/ServerActivity';
import LivePulse from '../components/Common/LivePulse';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import * as api from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import { ShieldAlert, Activity, Users, Shield, Ban, Server, Globe, AlertOctagon } from 'lucide-react';

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live WebSocket feed for recent events
  const { data: liveEvents, status: wsStatus } = useWebSocket('ws://localhost:8000/ws/events');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, timelineRes, alertStatsRes, serversRes, alertsRes] = await Promise.allSettled([
          api.getDashboardSummary(),
          api.getEventTimeline(24),
          api.getAlertStats(),
          api.getServers(),
          api.getAlerts({ page: 1, limit: 5 })
        ]);

        if (summaryRes.status === 'fulfilled') setSummaryData(summaryRes.value.data);
        if (timelineRes.status === 'fulfilled') {
          const rawTimeline = timelineRes.value.data;
          setTimeline(Array.isArray(rawTimeline) ? rawTimeline : (rawTimeline?.points || []));
        }
        if (alertStatsRes.status === 'fulfilled') setAlertStats(alertStatsRes.value.data);
        if (serversRes.status === 'fulfilled') setServers(Array.isArray(serversRes.value.data) ? serversRes.value.data : []);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data?.items || []);
        
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Backend may be unreachable.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner message="Initializing SOC Dashboard..." />;
  if (error && !summaryData) return <ErrorState message={error} />;

  const getMetricValue = (metric) => {
    if (!metric) return { current_value: 0, previous_value: 0, trend: 'stable' };
    return metric;
  };

  const safeEvents = Array.isArray(liveEvents) ? liveEvents : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Live Status Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px',
        background: 'var(--glass-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)',
        fontSize: '0.8rem'
      }}>
        <LivePulse active={wsStatus === 'CONNECTED'} />
        <span style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Stream
        </span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>Source: CyberStream Core Pipeline</span>
        <span style={{ marginLeft: 'auto', color: wsStatus === 'CONNECTED' ? 'var(--accent)' : 'var(--severity-high)' }}>
          ● {wsStatus}
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid-4">
        <StatCard title="Total Events" metric={getMetricValue(summaryData?.total_events)} icon={<Activity size={20} />} />
        <StatCard title="Events/sec" metric={getMetricValue(summaryData?.events_per_second)} icon={<Activity size={20} />} />
        <StatCard title="Active Alerts" metric={getMetricValue(summaryData?.active_alerts)} icon={<ShieldAlert size={20} />} />
        <StatCard title="Critical Alerts" metric={getMetricValue(summaryData?.critical_alerts)} icon={<AlertOctagon size={20} />} color="critical" />
        <StatCard title="Failed Logins" metric={getMetricValue(summaryData?.failed_logins)} icon={<Users size={20} />} />
        <StatCard title="Blocked Requests" metric={getMetricValue(summaryData?.blocked_requests)} icon={<Ban size={20} />} />
        <StatCard title="Active Servers" metric={getMetricValue(summaryData?.active_servers)} icon={<Server size={20} />} />
        <StatCard title="Unique IPs" metric={getMetricValue(summaryData?.unique_source_ips)} icon={<Globe size={20} />} />
      </div>

      {/* Event Timeline — Full Width */}
      <div className="card">
        <EventTimeline data={timeline} />
      </div>

      {/* Two Column Row */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Recent Live Events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
            {safeEvents.length > 0 ? safeEvents.slice(0, 15).map((evt, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                animation: idx === 0 ? 'fadeIn 0.3s ease' : 'none'
              }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: evt.severity === 'CRITICAL' ? 'var(--severity-critical-bg)' :
                    evt.severity === 'HIGH' ? 'var(--severity-high-bg)' :
                    evt.severity === 'MEDIUM' ? 'var(--severity-medium-bg)' : 'var(--severity-low-bg)',
                  color: evt.severity === 'CRITICAL' ? 'var(--severity-critical)' :
                    evt.severity === 'HIGH' ? 'var(--severity-high)' :
                    evt.severity === 'MEDIUM' ? 'var(--severity-medium)' : 'var(--severity-low)'
                }}>
                  {evt.severity || 'INFO'}
                </span>
                <span style={{ color: 'var(--accent-secondary)' }}>{evt.event_type}</span>
                <span style={{ color: 'var(--text-muted)' }}>from</span>
                <span style={{ color: 'var(--text-primary)' }}>{evt.source_ip}</span>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Waiting for live events...
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <ThreatDistribution data={alertStats} />
        </div>
      </div>

      {/* Two Column Row */}
      <div className="grid-2">
        <div className="card">
          <TopSourceIPs data={[]} />
        </div>
        <div className="card">
          <ActiveAlerts alerts={alerts} />
        </div>
      </div>

      {/* Server Activity — Full Width */}
      <div className="card">
        <ServerActivity data={servers} />
      </div>
    </div>
  );
};

export default DashboardPage;
