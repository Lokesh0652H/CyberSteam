import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomPieChart = ({ data, height = 300, innerRadius = 0, showLabels = false, showLegend = true }) => {
  return (
    <div style={{ width: '100%', height: height, background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={height / 2 - 40}
            paddingAngle={innerRadius > 0 ? 5 : 0}
            dataKey="value"
            stroke="none"
            label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
            labelLine={showLabels ? { stroke: 'var(--text-muted)' } : false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', borderRadius: '8px', backdropFilter: 'blur(12px)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', paddingTop: '20px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;
