import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const severityColorMap = {
  CRITICAL: '#ff3366',
  HIGH: '#ff6b35',
  MEDIUM: '#ffb800',
  LOW: '#00cc88',
  INFO: '#00aaff'
};

const ThreatDistribution = ({ data }) => {
  let chartData = [];
  
  if (Array.isArray(data)) {
    chartData = data;
  } else if (data && typeof data === 'object' && data.by_severity) {
    chartData = Object.entries(data.by_severity).map(([sev, val]) => ({
      name: sev,
      value: val,
      color: severityColorMap[sev] || '#8884d8'
    }));
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No active threats detected</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Threat Distribution</h3>
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', borderRadius: '8px', backdropFilter: 'blur(12px)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend 
              verticalAlign="middle" 
              align="right" 
              layout="vertical"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ThreatDistribution;
