import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Radio, ShieldAlert, Search, 
  Globe, Server, Map, GitBranch, Activity, BookOpen, 
  FileText, BarChart3, Settings, Menu, Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/target-app', icon: Zap, label: '🎯 Target Web App' },
  { path: '/events', icon: Radio, label: 'Live Events' },
  { path: '/alerts', icon: ShieldAlert, label: 'Alerts' },
  { path: '/explorer', icon: Search, label: 'Event Explorer' },
  { path: '/ips', icon: Globe, label: 'IP Analytics' },
  { path: '/servers', icon: Server, label: 'Server Analytics' },
  { path: '/geo', icon: Map, label: 'Geo Analytics' },
  { path: '/pipeline', icon: GitBranch, label: 'Pipeline Monitor' },
  { path: '/performance', icon: Activity, label: 'Performance' },
  { path: '/rules', icon: BookOpen, label: 'Rules' },
  { path: '/audit', icon: FileText, label: 'Audit Logs' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth() || { user: { name: 'Admin', role: 'SOC Analyst' } };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
            display: 'block' // hide this via CSS media queries normally, but inline it's tricky.
          }}
          className="mobile-overlay"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
        width: '260px',
        height: '100vh',
        background: 'var(--bg-sidebar, #0f1219)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        transition: 'transform 0.3s ease'
      }}>
        <div style={{ 
          height: '64px', display: 'flex', alignItems: 'center', 
          padding: '0 20px', borderBottom: '1px solid var(--border-primary)', gap: '12px'
        }}>
          <Shield size={24} color="var(--severity-info)" />
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>
            CyberStream
          </h1>
          <button className="mobile-close" onClick={toggleSidebar} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', display: 'none' }}>
            <Menu size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path} style={{ marginBottom: '4px' }}>
                <NavLink
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--severity-info)' : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: isActive ? 500 : 400
                  })}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ 
          padding: '20px', borderTop: '1px solid var(--border-primary)', 
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: 'var(--severity-info)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600
          }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{user?.username || 'Administrator'}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{typeof user?.role === 'object' ? user.role.label : (user?.role || 'Analyst')}</div>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .mobile-close { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
