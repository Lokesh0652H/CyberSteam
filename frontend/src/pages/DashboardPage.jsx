import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Chip, alpha, useTheme, Skeleton
} from '@mui/material';
import { motion } from 'framer-motion';
import StatCard from '../components/Dashboard/StatCard';
import EventTimeline from '../components/Dashboard/EventTimeline';
import ThreatDistribution from '../components/Dashboard/ThreatDistribution';
import TopSourceIPs from '../components/Dashboard/TopSourceIPs';
import ActiveAlerts from '../components/Dashboard/ActiveAlerts';
import ServerActivity from '../components/Dashboard/ServerActivity';
import * as api from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import { ShieldAlert, Activity, Users, Shield, Ban, Server, Globe, AlertOctagon } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' } }),
};

const DashboardPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [summaryData, setSummaryData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: liveEvents, status: wsStatus } = useWebSocket('ws://localhost:8000/ws/events');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, timelineRes, alertStatsRes, serversRes, alertsRes] = await Promise.allSettled([
          api.getDashboardSummary(),
          api.getEventTimeline(24),
          api.getAlertStats(),
          api.getServers(),
          api.getAlerts({ page: 1, limit: 5 })
        ]);
        if (summaryRes.status === 'fulfilled') setSummaryData(summaryRes.value.data);
        if (timelineRes.status === 'fulfilled') {
          const rawTimeline = timelineRes.value.data;
          setTimeline(Array.isArray(rawTimeline) ? rawTimeline : (rawTimeline?.points || []));
        }
        if (alertStatsRes.status === 'fulfilled') setAlertStats(alertStatsRes.value.data);
        if (serversRes.status === 'fulfilled') setServers(Array.isArray(serversRes.value.data) ? serversRes.value.data : []);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data?.items || []);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Backend may be unreachable.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getMetricValue = (metric) => {
    if (!metric) return { current_value: 0, previous_value: 0, trend: 'stable' };
    return metric;
  };

  const safeEvents = Array.isArray(liveEvents) ? liveEvents : [];

  const statCards = [
    { title: 'Total Events', metric: getMetricValue(summaryData?.total_events), icon: <Activity size={20} /> },
    { title: 'Events/sec', metric: getMetricValue(summaryData?.events_per_second), icon: <Activity size={20} /> },
    { title: 'Active Alerts', metric: getMetricValue(summaryData?.active_alerts), icon: <ShieldAlert size={20} /> },
    { title: 'Critical Alerts', metric: getMetricValue(summaryData?.critical_alerts), icon: <AlertOctagon size={20} />, color: 'critical' },
    { title: 'Failed Logins', metric: getMetricValue(summaryData?.failed_logins), icon: <Users size={20} /> },
    { title: 'Blocked Requests', metric: getMetricValue(summaryData?.blocked_requests), icon: <Ban size={20} /> },
    { title: 'Active Servers', metric: getMetricValue(summaryData?.active_servers), icon: <Server size={20} /> },
    { title: 'Unique IPs', metric: getMetricValue(summaryData?.unique_source_ips), icon: <Globe size={20} /> },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Skeleton variant="rounded" height={48} />
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Live Status Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper sx={{
          p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
          ...(isDark && {
            background: `linear-gradient(90deg, ${alpha('#00ff88', 0.04)}, ${alpha('#00d4ff', 0.04)})`,
            border: `1px solid ${alpha('#00ff88', 0.1)}`,
          })
        }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: wsStatus === 'CONNECTED' ? '#00ff88' : theme.palette.error.main,
            boxShadow: wsStatus === 'CONNECTED' ? `0 0 12px ${alpha('#00ff88', 0.6)}` : 'none',
            animation: wsStatus === 'CONNECTED' ? 'pulse 2s infinite' : 'none',
          }} />
          <Chip label="LIVE STREAM" size="small" color="success" variant="outlined" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.7rem' }} />
          <Typography variant="caption" color="text.secondary">|</Typography>
          <Typography variant="caption" color="text.secondary">Source: CyberStream Core Pipeline</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={wsStatus}
            size="small"
            color={wsStatus === 'CONNECTED' ? 'success' : 'error'}
            variant="filled"
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
        </Paper>
      </motion.div>

      {/* Stat Cards Grid */}
      <Grid container spacing={2}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <motion.div custom={idx} initial="hidden" animate="visible" variants={cardVariants}>
              <StatCard title={card.title} metric={card.metric} icon={card.icon} color={card.color} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Event Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <Paper sx={{ p: 2.5 }}>
          <EventTimeline data={timeline} />
        </Paper>
      </motion.div>

      {/* Two Column Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Paper sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Recent Live Events</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 300, overflowY: 'auto' }}>
                {safeEvents.length > 0 ? safeEvents.slice(0, 15).map((evt, idx) => (
                  <Box key={idx} sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    p: 1, borderRadius: 1.5,
                    bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
                    fontFamily: 'monospace', fontSize: '0.8rem',
                    ...(idx === 0 && { animation: 'fadeIn 0.3s ease' })
                  }}>
                    <Chip
                      label={evt.severity || 'INFO'}
                      size="small"
                      color={
                        evt.severity === 'CRITICAL' ? 'error' :
                        evt.severity === 'HIGH' ? 'warning' :
                        evt.severity === 'MEDIUM' ? 'warning' : 'success'
                      }
                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                    />
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontFamily: 'monospace' }}>
                      {evt.event_type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">from</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {evt.source_ip}
                    </Typography>
                  </Box>
                )) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Waiting for live events...</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Paper sx={{ p: 2.5, height: '100%' }}>
              <ThreatDistribution data={alertStats} />
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Second Two Column Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Paper sx={{ p: 2.5, height: '100%' }}>
              <TopSourceIPs data={[]} />
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Paper sx={{ p: 2.5, height: '100%' }}>
              <ActiveAlerts alerts={alerts} />
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Server Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <Paper sx={{ p: 2.5 }}>
          <ServerActivity data={servers} />
        </Paper>
      </motion.div>

      {/* Pulse animation keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default DashboardPage;
