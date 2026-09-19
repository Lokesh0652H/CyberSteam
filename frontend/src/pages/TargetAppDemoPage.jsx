import React, { useState } from 'react';
import * as api from '../api/endpoints';
import { Shield, Lock, AlertTriangle, Globe, Zap, Server, CheckCircle2, ArrowRight, ExternalLink, Terminal, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const TargetAppDemoPage = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [activeAttack, setActiveAttack] = useState('');
  const [attackLogs, setAttackLogs] = useState([]);
  const [socAlert, setSocAlert] = useState(null);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setAttackLogs(prev => [{ time, msg, type }, ...prev].slice(0, 30));
  };

  const handleSingleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Apex2026!') {
      setLoginStatus({ success: true, message: 'Authenticated successfully into Apex Core Portal.' });
      addLog(`[200 OK] User '${username}' logged in successfully`, 'success');
    } else {
      setLoginStatus({ success: false, message: 'Invalid credentials. (HTTP 401 Unauthorized)' });
      addLog(`[401 UNAUTHORIZED] Failed login attempt for user '${username}' from 198.51.100.45`, 'error');
    }
  };

  const handleLaunchAttack = async (scenario, title) => {
    setActiveAttack(title);
    setSocAlert(null);
    addLog(`>>> [ATTACK LAUNCHED] ${title} targeting Apex Core Banking System...`, 'warning');

    try {
      const res = await api.triggerScenario(scenario);
      
      if (scenario === 'brute_force') {
        for (let i = 1; i <= 8; i++) {
          setTimeout(() => {
            addLog(`[401 UNAUTHORIZED] Failed attempt #${i*2}/20 targeting user 'admin' (Source IP: 198.51.100.45)`, 'error');
          }, i * 200);
        }
        setTimeout(() => {
          setSocAlert({
            rule: 'Brute Force Detection',
            severity: 'HIGH',
            id: 'ALT-BRUTE',
            desc: '>10 LOGIN_FAILURE events detected from 198.51.100.45 within sliding window.'
          });
          addLog(`[SOC TRIGGER] CyberStream CEP Engine fired Alert: 'Brute Force Detection'`, 'alert');
          setActiveAttack('');
        }, 2200);
      } else if (scenario === 'ddos') {
        for (let i = 1; i <= 6; i++) {
          setTimeout(() => {
            addLog(`[HTTP FLOOD] GET /api/v1/accounts burst batch #${i} from 203.0.113.88 (Response: 503 Overload)`, 'error');
          }, i * 180);
        }
        setTimeout(() => {
          setSocAlert({
            rule: 'High Request Rate',
            severity: 'MEDIUM',
            id: 'ALT-DDOS',
            desc: '>50 requests from single IP in 10-second window.'
          });
          addLog(`[SOC TRIGGER] CyberStream CEP Engine fired Alert: 'High Request Rate'`, 'alert');
          setActiveAttack('');
        }, 1800);
      } else if (scenario === 'port_scan') {
        [21, 22, 23, 80, 443, 8080].forEach((port, idx) => {
          setTimeout(() => {
            addLog(`[FIREWALL BLOCK] Dropped probe to destination port ${port} from 185.220.101.5`, 'error');
          }, idx * 250);
        });
        setTimeout(() => {
          setSocAlert({
            rule: 'Suspicious Source',
            severity: 'HIGH',
            id: 'ALT-SCAN',
            desc: '>15 FIREWALL_BLOCK events from 185.220.101.5 in 300s window.'
          });
          addLog(`[SOC TRIGGER] CyberStream CEP Engine fired Alert: 'Suspicious Source'`, 'alert');
          setActiveAttack('');
        }, 2000);
      } else if (scenario === 'server_error_spike') {
        for (let i = 1; i <= 6; i++) {
          setTimeout(() => {
            addLog(`[HTTP 500] Database Connection pool timeout on SRV-003: Internal Server Error #${i*5}`, 'error');
          }, i * 200);
        }
        setTimeout(() => {
          setSocAlert({
            rule: 'Server Error Spike',
            severity: 'CRITICAL',
            id: 'ALT-ERROR',
            desc: '>20 SERVER_ERROR exceptions on SRV-003 in 300s window.'
          });
          addLog(`[SOC TRIGGER] CyberStream CEP Engine fired Alert: 'Server Error Spike'`, 'alert');
          setActiveAttack('');
        }, 1800);
      }
    } catch (err) {
      console.error(err);
      addLog(`[ERROR] Failed to dispatch attack packets`, 'error');
      setActiveAttack('');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Target Application Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 28, 48, 0.95), rgba(6, 15, 28, 0.98))',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              TARGET ENTERPRISE ENVIRONMENT
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Host Server: SRV-007 (10.0.1.7)</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Apex Global Banking & Financial Services
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Use this interactive corporate banking portal to simulate real cyber attacks during your teacher demo.
            Every action on this website generates telemetry processed live by the CyberStream Big Data pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0, 255, 136, 0.12)', border: '1px solid var(--accent)', borderRadius: '20px', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600 }}>
            <Shield size={16} /> Monitored by CyberStream SOC
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Telemetry stream: Kafka (cyber-events)</span>
        </div>
      </div>

      {/* Main Split Grid: Target Web App on Left (60%) | Attack Console & SOC Feedback on Right (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1.2fr) minmax(320px, 0.8fr)', gap: 'var(--gap-lg)' }}>
        
        {/* LEFT: The Target Web App (Customer Banking Portal UI) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          <div className="card" style={{ padding: '24px', background: '#0d131f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06080d', fontWeight: 800, fontSize: '1rem' }}>
                  A
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>Apex Online Banking Portal</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>https://banking.apex-corp.internal/login</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} /> TLS 1.3 Active
              </span>
            </div>

            {/* Simulated Customer Login Form */}
            <form onSubmit={handleSingleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '380px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Account ID / Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Master Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>

              {loginStatus && (
                <div style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: loginStatus.success ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 51, 102, 0.12)',
                  border: `1px solid ${loginStatus.success ? 'var(--accent)' : 'var(--severity-critical)'}`,
                  color: loginStatus.success ? 'var(--accent)' : 'var(--severity-critical)',
                  fontSize: '0.8rem'
                }}>
                  {loginStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPassword('wrong_pass_' + Math.floor(Math.random()*1000));
                    handleSingleLogin({ preventDefault: () => {} });
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Test 1 Failed Login
                </button>
              </div>
            </form>
          </div>

          {/* Target Infrastructure Services Status */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Target App Architecture & Endpoints (SRV-001 & SRV-007)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#fff' }}>POST /api/v1/auth/login</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Service: authentication (Port 443)</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#fff' }}>GET /api/v1/accounts</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Service: web-server (Port 80)</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#fff' }}>TCP Edge Ports (1-65535)</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Service: perimeter firewall</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#fff' }}>SQL /api/internal/query</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Service: database proxy (SRV-003)</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: The Attack Launchpad & Real-Time CyberStream Reaction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          {/* Attack Launchpad */}
          <div className="card" style={{ padding: '20px', border: '1px solid rgba(255, 51, 102, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Zap size={18} color="var(--severity-critical)" />
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Teacher Demonstration Attack Launchpad</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Click an attack to launch against the banking portal above. CyberStream's BDA pipeline will capture, stream, and flag the incident in real time:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleLaunchAttack('brute_force', 'Brute Force Credential Attack')}
                disabled={!!activeAttack}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', borderColor: 'var(--severity-critical)', color: '#fff', padding: '10px 14px' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--severity-critical)' }}>1. Launch Brute Force Attack</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fires 20 rapid failed logins &rarr; Triggers Rule #1</div>
                </div>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => handleLaunchAttack('ddos', 'L7 DDoS Request Flood')}
                disabled={!!activeAttack}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', borderColor: 'var(--severity-high)', color: '#fff', padding: '10px 14px' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--severity-high)' }}>2. Launch DDoS Web Flood</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Floods GET /api/v1/accounts (50 reqs) &rarr; Triggers Rule #3</div>
                </div>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => handleLaunchAttack('port_scan', 'Firewall Reconnaissance Port Scan')}
                disabled={!!activeAttack}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', borderColor: 'var(--severity-medium)', color: '#fff', padding: '10px 14px' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--severity-medium)' }}>3. Launch Port Scan</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Probes ports 21, 22, 23, 8080 &rarr; Triggers Rule #4</div>
                </div>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => handleLaunchAttack('server_error_spike', 'Internal Server Error Crash')}
                disabled={!!activeAttack}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', borderColor: 'var(--severity-info)', color: '#fff', padding: '10px 14px' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>4. Trigger Database 500 Outage</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fires 25 HTTP 500 Server Errors &rarr; Triggers Rule #5</div>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Real-Time Detection Alert Card (Appears dynamically upon detection!) */}
          {socAlert && (
            <div className="card" style={{
              padding: '16px 20px',
              background: 'rgba(255, 51, 102, 0.12)',
              border: '1px solid var(--severity-critical)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldAlert size={20} color="var(--severity-critical)" />
                <strong style={{ color: 'var(--severity-critical)', fontSize: '0.95rem' }}>
                  CYBERSTREAM SOC ALERT TRIGGERED!
                </strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                Rule: {socAlert.rule} [{socAlert.severity}]
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {socAlert.desc}
              </p>
              <Link
                to="/alerts"
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                Open Incident in Security Alerts Console <ExternalLink size={12} />
              </Link>
            </div>
          )}

          {/* Real-Time Attack Telemetry Console Terminal */}
          <div className="card" style={{ padding: '16px', background: '#080b11', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} /> LIVE PIPELINE INGEST LOG
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>● Ingesting packets</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {attackLogs.length > 0 ? (
                attackLogs.map((l, i) => (
                  <div key={i} style={{
                    color: l.type === 'error' ? 'var(--severity-critical)' :
                           l.type === 'warning' ? 'var(--severity-medium)' :
                           l.type === 'alert' ? 'var(--accent)' :
                           l.type === 'success' ? 'var(--severity-low)' : 'var(--text-secondary)'
                  }}>
                    [{l.time}] {l.msg}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
                  Target web app idle. Launch an attack above to observe packet capture.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetAppDemoPage;
