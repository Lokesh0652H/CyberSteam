import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base, #0a0c10)', color: 'var(--text-primary)' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: '260px',
        width: 'calc(100% - 260px)',
        transition: 'all 0.3s ease'
      }} className="main-content-wrapper">
        <Header toggleSidebar={toggleSidebar} />
        
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children || <Outlet />}
        </main>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .main-content-wrapper {
            marginLeft: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
