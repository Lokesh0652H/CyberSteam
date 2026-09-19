import React from 'react';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ConnectionStatus from '../Common/ConnectionStatus';

const Header = ({ toggleSidebar, title = 'Dashboard' }) => {
  const { logout } = useAuth() || { logout: () => {} };
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isLive, setIsLive] = React.useState(true);

  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleSidebar}
          className="mobile-menu-btn"
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Live/Historical Toggle */}
        <div style={{ 
          display: 'flex', alignItems: 'center', background: 'var(--bg-input)', 
          borderRadius: '20px', padding: '4px', gap: '4px'
        }}>
          <button 
            onClick={() => setIsLive(true)}
            style={{
              padding: '4px 12px', border: 'none', borderRadius: '16px', fontSize: '12px', fontWeight: 500,
              background: isLive ? 'var(--severity-info)' : 'transparent',
              color: isLive ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Live
          </button>
          <button 
            onClick={() => setIsLive(false)}
            style={{
              padding: '4px 12px', border: 'none', borderRadius: '16px', fontSize: '12px', fontWeight: 500,
              background: !isLive ? 'var(--glass-bg)' : 'transparent',
              color: !isLive ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Historical
          </button>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', gap: '12px', borderRight: '1px solid var(--border-primary)', paddingRight: '24px' }} className="status-indicators">
          <ConnectionStatus status="CONNECTED" /> {/* Kafka */}
        </div>

        <div style={{ position: 'relative' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative' }}>
            <Bell size={20} />
            <span style={{ 
              position: 'absolute', top: '-4px', right: '-4px', 
              background: 'var(--severity-critical)', color: '#fff', 
              fontSize: '10px', width: '16px', height: '16px', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              3
            </span>
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ 
              background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--severity-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>A</div>
            <ChevronDown size={16} color="var(--text-secondary)" />
          </button>
          
          {showDropdown && (
            <div style={{ 
              position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)', 
              borderRadius: '8px', boxShadow: 'var(--glass-shadow)', minWidth: '150px', overflow: 'hidden'
            }}>
              <button 
                onClick={logout}
                style={{ 
                  width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', 
                  background: 'none', border: 'none', color: 'var(--severity-critical)', cursor: 'pointer',
                  textAlign: 'left', fontSize: '14px'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .status-indicators { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
