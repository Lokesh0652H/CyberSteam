import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import * as api from '../api/endpoints';
import { BarChart3, Download, RefreshCw, Server, Globe, ShieldAlert, CheckCircle, FileSpreadsheet, FileText } from 'lucide-react';

const ReportsPage = () => {
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState('');

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.getSecurityReport(period);
      setReport(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to generate analytical security report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [period]);

  const handleExportCSV = async () => {
    try {
      setDownloading('csv');
      const res = await api.exportReportCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cyberstream_security_report_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("CSV Export failed", e);
    } finally {
      setDownloading('');
    }
  };

  const handleExportPDF = async () => {
    try {
      setDownloading('pdf');
      const res = await api.exportReportPdf();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cyberstream_security_report_${period}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("PDF Export failed", e);
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header with Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 color="var(--accent)" size={24} /> Automated Security & Compliance Reports
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Consolidated Big Data telemetry aggregation reports for SOC leadership and compliance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
            style={{ width: '130px' }}
          >
            <option value="daily">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>

          <button onClick={generateReport} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Re-Generate
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner message={`Compiling ${period} security aggregates...`} />}
      {error && <ErrorState message={error} onRetry={generateReport} />}

      {report && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
          {/* Action Ribbon */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {period.charAt(0).toUpperCase() + period.slice(1)} Security Audit Executive Summary
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Generated at: {new Date(report.generated_at || Date.now()).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleExportPDF}
                disabled={downloading === 'pdf'}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={14} /> {downloading === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={downloading === 'csv'}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileSpreadsheet size={14} /> {downloading === 'csv' ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* High-level KPIs */}
          <div className="grid-3">
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Total Streaming Events Processed</span>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {(report.total_events || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Stored in PostgreSQL/HDFS</span>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Rule-Triggered Alerts</span>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                {report.total_alerts || 0}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated rule engine detections</span>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px solid var(--severity-critical)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--severity-critical)' }}>Critical Security Incidents</span>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--severity-critical)' }}>
                {report.critical_incidents || 0}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--severity-critical)' }}>Requires immediate analyst response</span>
            </div>
          </div>

          {/* Two Columns: Top Targets & Top Sources */}
          <div className="grid-2">
            {/* Top Targeted Servers */}
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="var(--accent)" /> Top Targeted Host Infrastructure
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.top_servers && report.top_servers.length > 0 ? (
                  report.top_servers.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.server || 'Unknown Host'}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{(s.count || 0).toLocaleString()} events</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No targeted host activity reported for this timeframe.
                  </div>
                )}
              </div>
            </div>

            {/* Top Attack Sources */}
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="var(--severity-critical)" /> Top Suspicious Source IPs
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.top_sources && report.top_sources.length > 0 ? (
                  report.top_sources.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.ip || 'Unknown IP'}</span>
                      <span style={{ color: 'var(--severity-high)', fontWeight: 700 }}>{(s.count || 0).toLocaleString()} events</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No threat source IPs flagged for this timeframe.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
