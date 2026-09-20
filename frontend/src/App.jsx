import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './auth/Login';
import Layout from './components/Layout/Layout';
import './App.css';

// Pages
import DashboardPage from './pages/DashboardPage';
import LiveEventsPage from './pages/LiveEventsPage';
import AlertsPage from './pages/AlertsPage';
import EventExplorerPage from './pages/EventExplorerPage';
import IPAnalyticsPage from './pages/IPAnalyticsPage';
import ServerAnalyticsPage from './pages/ServerAnalyticsPage';
import GeoAnalyticsPage from './pages/GeoAnalyticsPage';
import PipelineMonitorPage from './pages/PipelineMonitorPage';
import PerformancePage from './pages/PerformancePage';
import RulesPage from './pages/RulesPage';
import AuditLogPage from './pages/AuditLogPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TargetAppDemoPage from './pages/TargetAppDemoPage';
import AssistantPage from './pages/AssistantPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/target-app" element={<TargetAppDemoPage />} />
          <Route path="/events" element={<LiveEventsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/explorer" element={<EventExplorerPage />} />
          <Route path="/ips" element={<IPAnalyticsPage />} />
          <Route path="/servers" element={<ServerAnalyticsPage />} />
          <Route path="/geo" element={<GeoAnalyticsPage />} />
          <Route path="/pipeline" element={<PipelineMonitorPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
