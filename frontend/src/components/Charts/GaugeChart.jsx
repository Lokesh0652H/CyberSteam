import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const GaugeChart = ({ value, max = 100, label, color = 'var(--severity-info)' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const data = [
    { name: 'background', value: 100, fill: 'rgba(255,255,255,0.05)' },
    { name: label, value: percentage, fill: color }
  ];

  return (
    <div style={{ width: '100%', height: '200px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="75%" 
          innerRadius="70%" 
          outerRadius="90%" 
          barSize={15} 
          data={data} 
          startAngle={180} 
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            minAngle={15}
            background={{ fill: 'rgba(255,255,255,0.05)' }}
            clockWise
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      <div style={{ position: 'absolute', bottom: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      </div>
    </div>
  );
};

export default GaugeChart;
