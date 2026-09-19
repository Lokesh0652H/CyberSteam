import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import { useAuth } from '../hooks/useAuth';
import * as api from '../api/endpoints';
import { Settings, Play, Square, Zap, ShieldAlert, Cpu, Server, CheckCircle, RefreshCw } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scenarioStatus, setScenarioStatus] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await api.getGeneratorStatus();
      setStatus(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch streaming generator status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action) => {
    try {
      if (action === 'start') await api.startGenerator();
      else if (action === 'stop') await api.stopGenerator();
      fetchStatus();
    } catch (e) {
      console.error(`Failed to ${action} generator`, e);
    }
  };

  const handleRateChange = async (rate) => {
    try {
      await api.setGeneratorRate(rate);
      setStatus(prev => ({ ...prev, rate }));
    } catch (e) {
      console.error('Failed to set rate', e);
    }
  };

  const triggerAttack = async (scenario, name) => {
    try {
      setScenarioStatus(`Injecting ${name} traffic...`);
      await api.triggerScenario(scenario);
      setTimeout(() => {
        setScenarioStatus(`${name} injected successfully! Check Live Events and Alerts.`);
      }, 1000);
      setTimeout(() => setScenarioStatus(''), 6000);
    } catch (e) {
      console.error("Failed to trigger scenario", e);
      setScenarioStatus('Failed to inject attack scenario.');
    }
  };

  if (loading && !status) return <LoadingSpinner message="Checking Generator Service..." />;

  const isRunning = status?.status === 'running';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings color="var(--accent)" size={24} /> Engine Settings & Red Team Simulation
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Control streaming data generator, ingest rates, and deterministic attack injection scenarios
          </p>
        </div>
        <button onClick={fetchStatus} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Generator Master Controls */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} color="var(--accent-secondary)" /> High-Velocity Stream Generator Service
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Port 8001 | Synthesizes realistic HTTP, Auth, Firewall, and DNS traffic
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
              background: isRunning ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 102, 0.15)',
              color: isRunning ? 'var(--accent)' : 'var(--severity-critical)'
            }}>
              ● {isRunning ? 'STREAMING ACTIVE' : 'STOPPED'}
            </span>

            {isRunning ? (
              <button
                onClick={() => handleAction('stop')}
                className="btn btn-sm btn-ghost"
                style={{ borderColor: 'var(--severity-critical)', color: 'var(--severity-critical)' }}
              >
                <Square size={14} /> Stop Generator
              </button>
            ) : (
              <button
                onClick={() => handleAction('start')}
                className="btn btn-sm btn-primary"
              >
                <Play size={14} /> Start Generator
              </button>
            )}
          </div>
        </div>

        {/* Rate Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Stream Throughput (Events Per Second):
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[10, 50, 100, 500, 1000].map(r => (
              <button
                key={r}
                onClick={() => handleRateChange(r)}
                className={(status?.rate || 100) === r ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {r} EPS
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Red Team Attack Scenario Simulator */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255, 51, 102, 0.25)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--severity-critical)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--severity-critical)" /> Red Team Attack Scenario Injection (For Teacher Demo)
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Inject deterministic cyber attack patterns to demonstrate the rule engine firing in real time:
          </p>
        </div>

        {scenarioStatus && (
          <div style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 255, 136, 0.12)', border: '1px solid var(--accent)',
            color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle size={16} /> {scenarioStatus}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>1. Brute Force Attack</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>20 rapid failed logins from attacker IP targeting `admin`. Triggers Rule #1.</span>
            <button
              onClick={() => triggerAttack('brute_force', 'Brute Force Attack')}
              className="btn btn-sm btn-secondary"
              style={{ marginTop: 'auto', borderColor: 'var(--severity-critical)', color: 'var(--severity-critical)' }}
            >
              🚨 Inject Brute Force
            </button>
          </div>

          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>2. DDoS Traffic Surge</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>70 requests within 10s from a single IP to saturate server. Triggers Rule #3.</span>
            <button
              onClick={() => triggerAttack('ddos', 'DDoS Flood')}
              className="btn btn-sm btn-secondary"
              style={{ marginTop: 'auto', borderColor: 'var(--severity-high)', color: 'var(--severity-high)' }}
            >
              💥 Inject DDoS Surge
            </button>
          </div>

          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>3. Firewall Port Scan</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>25 consecutive blocked probe attempts across destination ports. Triggers Rule #4.</span>
            <button
              onClick={() => triggerAttack('port_scan', 'Port Scan')}
              className="btn btn-sm btn-secondary"
              style={{ marginTop: 'auto', borderColor: 'var(--severity-medium)', color: 'var(--severity-medium)' }}
            >
              🔥 Inject Port Scan
            </button>
          </div>

          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>4. Server 500 Outage</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>30 HTTP 500 Internal Server Error spikes on SRV-003. Triggers Rule #5.</span>
            <button
              onClick={() => triggerAttack('server_error_spike', 'Server Crash Spike')}
              className="btn btn-sm btn-secondary"
              style={{ marginTop: 'auto', borderColor: 'var(--severity-info)', color: 'var(--severity-info)' }}
            >
              ⚠️ Inject Server 500 Spike
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Architecture & Environment Metadata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div><strong>Project:</strong> CyberStream Distributed BDA</div>
          <div><strong>Engine:</strong> FastAPI 0.110 / Python 3.11</div>
          <div><strong>Broker:</strong> Apache Kafka (Topic: cyber-events)</div>
          <div><strong>Stream Processor:</strong> Spark Sliding-Window Aggregator</div>
          <div><strong>Storage Layer:</strong> PostgreSQL + HDFS Parquet</div>
          <div><strong>UI Protocol:</strong> Reactive WebSockets (RFC 6455)</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
