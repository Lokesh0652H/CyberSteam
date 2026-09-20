import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Box className="animated-bg" sx={{ display: 'flex', minHeight: '100vh', color: 'text.primary' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { sm: `calc(100% - 260px)` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Header toggleSidebar={toggleSidebar} isMobile={isMobile} />
        
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
