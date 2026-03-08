const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock data for testing
const mockUsers = [
  { id: 1, email: 'test@example.com', name: 'Test User' }
];

const mockSessions = [
  { id: 1, userId: 1, role: 'Software Engineer', status: 'completed' }
];

// Mock authentication routes
app.post('/api/auth/register', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Registration successful (mock)',
    token: 'mock-jwt-token',
    user: { id: 1, email: req.body.email, name: req.body.name }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Login successful (mock)',
    token: 'mock-jwt-token',
    user: { id: 1, email: req.body.email, name: 'Test User' }
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.json({ 
    success: true, 
    user: { id: 1, email: 'test@example.com', name: 'Test User' }
  });
});

app.get('/api/auth/history', (req, res) => {
  res.json({ 
    success: true, 
    sessions: mockSessions
  });
});

// Mock interview routes
app.post('/api/interview/start', (req, res) => {
  res.json({ 
    success: true, 
    session: {
      sessionId: 'mock-session-123',
      rolePrompt: req.body.rolePrompt || 'Mock interview role',
      settings: req.body.settings || {},
      startTime: new Date().toISOString()
    },
    message: 'Interview session started (mock)'
  });
});

app.get('/api/interview/session/:id', (req, res) => {
  res.json({ 
    success: true, 
    session: {
      id: req.params.id,
      role: 'Software Engineer',
      status: 'active',
      messages: []
    }
  });
});

app.post('/api/interview/session/:id/message', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Message added (mock)'
  });
});

app.post('/api/interview/session/:id/end', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Session ended (mock)'
  });
});

// Mock AI routes
app.post('/api/ai/chat', (req, res) => {
  res.json({ 
    success: true, 
    response: 'This is a mock AI response. The AI features are not available without proper configuration.',
    role: req.body.role || 'Interviewer'
  });
});

app.post('/api/ai/transcribe', (req, res) => {
  res.json({ 
    success: true, 
    text: 'Mock transcribed text from audio'
  });
});

app.post('/api/ai/synthesize', (req, res) => {
  res.json({ 
    success: true, 
    audioUrl: 'mock-audio-url'
  });
});

app.get('/api/ai/role-prompts', (req, res) => {
  res.json({ 
    success: true, 
    roles: [
      { id: 1, title: 'Software Engineer', description: 'Technical interview for software development role' },
      { id: 2, title: 'Data Scientist', description: 'Analytics and machine learning focused interview' },
      { id: 3, title: 'Product Manager', description: 'Product strategy and management interview' }
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Interview Server is running (MOCK MODE - No MongoDB)',
    mode: 'mock'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server without MongoDB
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (MOCK MODE - No MongoDB required)`);
  console.log(`📱 Frontend should be available at http://localhost:3000`);
  console.log(`🔧 Backend API available at http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 