import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomBarChart = ({ data, bars, xAxisKey = 'name', height = 300, layout = 'horizontal' }) => {
  return (
    <div style={{ width: '100%', height: height, background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 10, right: 10, left: layout === 'horizontal' ? -20 : 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={layout === 'horizontal'} horizontal={layout === 'vertical'} />
          
          {layout === 'horizontal' ? (
            <>
              <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey={xAxisKey} type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={100} />
            </>
          )}
          
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', borderRadius: '8px', backdropFilter: 'blur(12px)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
          
          {bars.map((bar, i) => (
            <Bar 
              key={i} 
              dataKey={bar.dataKey} 
              name={bar.name} 
              fill={bar.color} 
              radius={[4, 4, layout === 'horizontal' ? 0 : 4, layout === 'horizontal' ? 0 : 4]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
