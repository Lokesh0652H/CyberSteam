import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, Avatar, Chip,
  CircularProgress, Card, CardContent, alpha, useTheme
} from '@mui/material';
import { Send, SmartToy, Person, Psychology, Security, Terminal } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api/endpoints';

const AssistantPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🛡️ **CyberStream SOC Assistant**\n\nI'm your AI-powered Security Operations Center assistant. I can help you with:\n\n• **Alert Analysis** — Explain security alerts and suggest remediation\n• **Threat Intelligence** — Provide context on attack patterns\n• **Metric Interpretation** — Help understand dashboard data\n• **Incident Response** — Guide you through response procedures\n• **Rule Tuning** — Advise on detection rule configurations\n\nHow can I help you today?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getLlmStatus().then(res => setLlmStatus(res.data)).catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAssistant(input.trim());
      const assistantMsg = {
        role: 'assistant',
        content: res.data.response || res.data.message || 'No response received.',
        model: res.data.model,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Error**: ${err.response?.data?.detail || err.message || 'Failed to get response. Make sure LLM_ENABLED=true and LLM_API_KEY is set in your .env file.'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    '🔍 What are the top threats right now?',
    '🚨 Explain brute force detection rules',
    '📊 How to interpret event per second metrics?',
    '🛡️ What is a DDoS attack?',
    '⚙️ How to tune false positive alerts?',
    '📋 Suggest an incident response plan'
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 2 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
            width: 48, height: 48
          }}>
            <Psychology />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              SOC AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Powered by OpenAI • Real-time security analysis & guidance
            </Typography>
          </Box>
          <Chip
            icon={<Terminal sx={{ fontSize: 16 }} />}
            label={llmStatus?.enabled ? `${llmStatus.provider} / ${llmStatus.model}` : 'LLM Disabled'}
            color={llmStatus?.enabled ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Paper>
      </motion.div>

      {/* Messages Area */}
      <Paper sx={{
        flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2,
        background: isDark ? alpha('#060810', 0.6) : undefined
      }}>
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{
                display: 'flex', gap: 1.5,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}>
                <Avatar sx={{
                  width: 36, height: 36,
                  bgcolor: msg.role === 'user'
                    ? alpha(theme.palette.secondary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.15),
                  color: msg.role === 'user' ? theme.palette.secondary.main : theme.palette.primary.main
                }}>
                  {msg.role === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                <Card sx={{
                  maxWidth: '75%',
                  ...(msg.role === 'user' && {
                    background: isDark
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`
                      : alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                  }),
                  ...(msg.isError && {
                    borderColor: alpha(theme.palette.error.main, 0.3)
                  })
                }}>
                  <CardContent sx={{ p: '12px !important', '&:last-child': { pb: '12px !important' } }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {msg.content}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                      {msg.model && (
                        <Chip label={msg.model} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Avatar sx={{
                width: 36, height: 36,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main
              }}>
                <SmartToy />
              </Avatar>
              <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">Analyzing...</Typography>
              </Paper>
            </Box>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestedPrompts.map((prompt, idx) => (
              <Chip
                key={idx}
                label={prompt}
                onClick={() => { setInput(prompt.replace(/^[^\s]+\s/, '')); }}
                variant="outlined"
                clickable
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              />
            ))}
          </Box>
        </motion.div>
      )}

      {/* Input Area */}
      <Paper sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <Security sx={{ color: 'text.secondary', mb: 1 }} />
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the SOC assistant anything about security monitoring..."
          variant="outlined"
          size="small"
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.15)}`
              }
            }
          }}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
            mb: 0.5,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.25),
              boxShadow: `0 0 16px ${alpha(theme.palette.primary.main, 0.3)}`
            },
            '&.Mui-disabled': { color: 'text.disabled' }
          }}
        >
          <Send />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default AssistantPage;
