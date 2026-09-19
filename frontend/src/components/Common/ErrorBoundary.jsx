import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CyberStream Boundary Caught Error:", error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      // After 3 retries, do a full page reload to clear all state
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    this.setState(prev => ({ 
      hasError: false, 
      error: null, 
      retryCount: prev.retryCount + 1 
    }));
  };

  handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06080d',
          color: '#e8edf5',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#111620',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: 56, height: 56,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(255, 51, 102, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff3366'
            }}>
              <AlertTriangle size={28} />
            </div>
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Dashboard Component Error
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#8b95a8', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={this.handleRetry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#00ff88',
                  color: '#06080d',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <RefreshCw size={16} />
                {this.state.retryCount >= 3 ? 'Back to Login' : 'Retry'}
              </button>
              
              <button 
                onClick={this.handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'rgba(255,51,102,0.12)',
                  color: '#ff3366',
                  fontWeight: 600,
                  border: '1px solid rgba(255,51,102,0.25)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Logout
              </button>
            </div>
            
            {this.state.retryCount > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#5a6478', marginTop: '16px' }}>
                Retry attempt {this.state.retryCount}/3
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
