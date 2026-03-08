const express = require('express');
const { body, validationResult } = require('express-validator');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Start new interview session
router.post('/start', auth, [
  body('rolePrompt').trim().notEmpty(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rolePrompt, settings = {} } = req.body;
    const sessionId = uuidv4();

    // Create new interview session
    const session = new InterviewSession({
      sessionId,
      userId: req.user.userId,
      rolePrompt,
      settings: {
        voiceEnabled: settings.voiceEnabled !== undefined ? settings.voiceEnabled : true,
        maxQuestions: settings.maxQuestions || 10,
        timeLimit: settings.timeLimit || 30
      }
    });

    await session.save();

    // Add to user's interview history
    await User.findByIdAndUpdate(req.user.userId, {
      $push: {
        interviewHistory: {
          sessionId,
          rolePrompt,
          startTime: new Date()
        }
      }
    });

    res.status(201).json({
      message: 'Interview session started',
      session: {
        sessionId,
        rolePrompt,
        settings: session.settings,
        startTime: session.startTime
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Server error starting interview session' });
  }
});

// Get session details
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await InterviewSession.findOne({
      sessionId,
      userId: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Server error getting session' });
  }
});

// Add message to session
router.post('/session/:sessionId/message', auth, [
  body('content').trim().notEmpty(),
  body('inputType').optional().isIn(['text', 'voice']),
  // Allow audioUrl to be missing or null; only validate when it's a non-empty string
  body('audioUrl').optional({ nullable: true, checkFalsy: true }).isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;
    const { content, inputType = 'text', audioUrl = null } = req.body;

    const session = await InterviewSession.findOne({
      sessionId,
      userId: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Add user message
    await session.addMessage('user', content, inputType, audioUrl);

    res.json({
      message: 'Message added successfully',
      sessionId,
      messageCount: session.messages.length
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Server error adding message' });
  }
});

// End interview session
router.post('/session/:sessionId/end', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findOne({
      sessionId,
      userId: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is already ended' });
    }

    // End session and calculate analytics
    await session.endSession();
    await session.calculateAnalytics();

    // Update user's interview history
    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        'interviewHistory.$[elem].status': 'completed',
        'interviewHistory.$[elem].endTime': session.endTime,
        'interviewHistory.$[elem].totalQuestions': session.totalQuestions
      }
    }, {
      arrayFilters: [{ 'elem.sessionId': sessionId }]
    });

    res.json({
      message: 'Session ended successfully',
      session: {
        sessionId,
        status: session.status,
        totalQuestions: session.totalQuestions,
        totalDuration: session.totalDuration,
        analytics: session.analytics
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Server error ending session' });
  }
});

// Get user's active sessions
router.get('/active', auth, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({
      userId: req.user.userId,
      status: 'active'
    }).sort({ startTime: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ error: 'Server error getting active sessions' });
  }
});

// Get session messages
router.get('/session/:sessionId/messages', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await InterviewSession.findOne({
      sessionId,
      userId: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ messages: session.messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error getting messages' });
  }
});

// Abandon session
router.post('/session/:sessionId/abandon', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findOne({
      sessionId,
      userId: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'abandoned';
    session.endTime = new Date();
    await session.save();

    // Update user's interview history
    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        'interviewHistory.$[elem].status': 'abandoned',
        'interviewHistory.$[elem].endTime': session.endTime
      }
    }, {
      arrayFilters: [{ 'elem.sessionId': sessionId }]
    });

    res.json({
      message: 'Session abandoned successfully',
      sessionId
    });
  } catch (error) {
    console.error('Abandon session error:', error);
    res.status(500).json({ error: 'Server error abandoning session' });
  }
});

module.exports = router; 