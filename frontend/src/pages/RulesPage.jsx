import React, { useState, useEffect } from 'react';
import SeverityBadge from '../components/Common/SeverityBadge';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import { useAuth } from '../hooks/useAuth';
import * as api from '../api/endpoints';
import { ShieldCheck, Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const RulesPage = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'aggregation',
    condition_field: 'event_type',
    condition_operator: '==',
    threshold: 10,
    time_window_seconds: 300,
    severity: 'HIGH',
    group_by_field: 'source_ip',
    is_active: true
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRules();
      setRules(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch detection rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      rule_type: 'aggregation',
      condition_field: 'event_type',
      condition_operator: '==',
      threshold: 10,
      time_window_seconds: 300,
      severity: 'HIGH',
      group_by_field: 'source_ip',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type || 'aggregation',
      condition_field: rule.condition_field || 'event_type',
      condition_operator: rule.condition_operator || '==',
      threshold: rule.threshold || 10,
      time_window_seconds: rule.time_window_seconds || 300,
      severity: rule.severity || 'HIGH',
      group_by_field: rule.group_by_field || 'source_ip',
      is_active: rule.is_active ?? true
    });
    setShowModal(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingRule) {
        await api.updateRule(editingRule.id, formData);
      } else {
        await api.createRule(formData);
      }
      setShowModal(false);
      fetchRules();
    } catch (err) {
      console.error("Failed to save rule", err);
      alert("Error saving rule. Please check inputs.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId, currentActive) => {
    try {
      await api.updateRule(ruleId, { is_active: !currentActive });
      setRules(rules.map(r => r.id === ruleId ? { ...r, is_active: !currentActive } : r));
    } catch (e) {
      console.error('Failed to toggle rule', e);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm("Are you sure you want to delete this detection rule?")) {
      try {
        await api.deleteRule(ruleId);
        fetchRules();
      } catch (err) {
        console.error("Failed to delete rule", err);
      }
    }
  };

  if (loading && rules.length === 0) return <LoadingSpinner message="Loading Streaming Detection Rules..." />;
  if (error && rules.length === 0) return <ErrorState message={error} onRetry={fetchRules} />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck color="var(--accent)" size={24} /> Streaming Security Detection Rules
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time threshold and sliding window aggregation rule engine evaluated on streaming batches
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchRules} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Create Detection Rule
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Rule Name</th>
                <th style={{ padding: '12px 16px' }}>Description & Logic</th>
                <th style={{ padding: '12px 16px' }}>Threshold</th>
                <th style={{ padding: '12px 16px' }}>Time Window</th>
                <th style={{ padding: '12px 16px' }}>Group By</th>
                <th style={{ padding: '12px 16px' }}>Severity</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rule.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {rule.description || 'Threshold detection logic'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent)' }}>
                      &gt; {rule.threshold}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                      {rule.time_window_seconds}s
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {rule.group_by_field || 'source_ip'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <SeverityBadge severity={rule.severity} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => toggleRule(rule.id, rule.is_active)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '16px', border: 'none',
                          fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                          background: rule.is_active ? 'rgba(0, 255, 136, 0.15)' : 'rgba(90, 100, 120, 0.2)',
                          color: rule.is_active ? 'var(--accent)' : 'var(--text-muted)'
                        }}
                      >
                        {rule.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {rule.is_active ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 8px' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="btn btn-sm btn-ghost"
                          style={{ padding: '4px 8px', color: 'var(--severity-critical)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No security rules registered. Click "+ Create Detection Rule" to define one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '90%', padding: '24px', background: '#0e121a' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {editingRule ? 'Edit Detection Rule' : 'Create Stream Detection Rule'}
            </h3>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DDoS Volume Spike"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Detects excessive request volume from a single IP"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Event Threshold (Count)</label>
                  <input
                    type="number"
                    required
                    value={formData.threshold}
                    onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value) || 1 })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Time Window (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={formData.time_window_seconds}
                    onChange={e => setFormData({ ...formData, time_window_seconds: parseInt(e.target.value) || 60 })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Severity Level</label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Aggregate Group By</label>
                  <select
                    value={formData.group_by_field}
                    onChange={e => setFormData({ ...formData, group_by_field: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="source_ip">source_ip</option>
                    <option value="username">username</option>
                    <option value="server_id">server_id</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
