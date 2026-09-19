import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      background: 'var(--bg-card)',
      border: '1px solid var(--severity-high)',
      borderRadius: '12px',
      textAlign: 'center',
      minHeight: '200px'
    }}>
      <AlertTriangle size={48} color="var(--severity-high)" style={{ marginBottom: '16px' }} />
      <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Something went wrong</h3>
      <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', maxWidth: '400px' }}>
        {message || 'An error occurred while fetching data.'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 24px',
            background: 'var(--severity-info)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = 0.8}
          onMouseOut={e => e.currentTarget.style.opacity = 1}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
