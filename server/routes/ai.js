const express = require('express');
const OpenAI = require('openai');
const { body, validationResult } = require('express-validator');
const InterviewSession = require('../models/InterviewSession');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const hasGoogleKey =
  typeof GOOGLE_API_KEY === 'string' &&
  GOOGLE_API_KEY.startsWith('AIza');

// Initialize OpenAI (if API key looks valid)
// Treat obviously placeholder or truncated values as "no key"
const openAIKey = process.env.OPENAI_API_KEY;
const hasOpenAIKey =
  typeof openAIKey === 'string' &&
  openAIKey.startsWith('sk-') &&
  !openAIKey.includes('...') &&
  openAIKey.replace(/"/g, '').length > 40;
const openai = hasOpenAIKey
  ? new OpenAI({
      apiKey: openAIKey.replace(/"/g, '')
    })
  : null;

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Simple local fallback when OpenAI is not available
function generateMockResponse(message, rolePrompt) {
  const trimmedMessage = message.trim();
  const base =
    trimmedMessage.length > 0
      ? `Thanks for your response: "${trimmedMessage}". Here's some feedback and a follow-up question.`
      : `Thanks for your response. Here's some feedback and a follow-up question.`;

  const context = rolePrompt
    ? ` As the interviewer (${rolePrompt.slice(0, 80)}...), consider how clearly the answer shows structure, impact, and relevant experience.`
    : ' Consider how clearly the answer shows structure, impact, and relevant experience.';

  const followUp =
    ' To go deeper, try adding concrete examples, measurable outcomes, and a clear structure (situation, task, action, result).';

  return `${base}${context}${followUp}`;
}

function getFallbackFeedback(text) {
  const length = text.trim().length;
  const confidence = Math.max(3, Math.min(9, Math.round(length / 40)));
  return {
    grammar: length > 40 ? 'good' : 'fair',
    confidence,
    notes:
      'Focus on speaking clearly, organizing your answer, and backing up your points with specific examples and outcomes.'
  };
}

async function generateGeminiResponse(session, userMessage) {
  if (!hasGoogleKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent' +
    `?key=${encodeURIComponent(GOOGLE_API_KEY)}`;

  const historyText = (session.messages || [])
    .map(msg => {
      const speaker = msg.role === 'assistant' ? 'Interviewer' : 'Candidate';
      return `${speaker}: ${msg.content}`;
    })
    .join('\n');

  const prompt = `
You are an AI interviewer conducting a professional interview.
Role prompt: ${session.rolePrompt}

Conversation so far:
${historyText}

The candidate has just answered:
${userMessage}

Reply with the next interviewer message only. Do not explain your reasoning.
`.trim();

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .join(' ')
      .trim() || 'I was unable to generate a response. Please try again.';

  return text;
}

// Get AI response for interview
router.post('/chat', auth, [
  body('sessionId').notEmpty(),
  body('message').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, message } = req.body;

    // Get session
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

    let aiResponse;
    let feedback;

    const useGoogle = AI_PROVIDER === 'google' && hasGoogleKey;

    // Prefer Google Gemini when selected, otherwise use OpenAI when configured,
    // and finally fall back to a local mock.
    if (useGoogle) {
      try {
        aiResponse = await generateGeminiResponse(session, message);

        await session.addMessage('user', message);
        await session.addMessage('assistant', aiResponse);

        feedback = getFallbackFeedback(message);
      } catch (geminiError) {
        console.error('Gemini chat error:', geminiError);
        aiResponse = generateMockResponse(message, session.rolePrompt);
        feedback = getFallbackFeedback(message);

        await session.addMessage('user', message);
        await session.addMessage('assistant', aiResponse);
      }
    } else if (openai) {
      // Prepare conversation history for OpenAI
      const messages = [
        {
          role: 'system',
          content: session.rolePrompt
        },
        ...session.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      aiResponse = completion.choices[0].message.content;

      // Add both user message and AI response to session
      await session.addMessage('user', message);
      await session.addMessage('assistant', aiResponse);

      // Analyze user response for feedback
      feedback = await analyzeUserResponse(message);
    } else {
      aiResponse = generateMockResponse(message, session.rolePrompt);
      feedback = getFallbackFeedback(message);

      await session.addMessage('user', message);
      await session.addMessage('assistant', aiResponse);
    }

    res.json({
      message: 'AI response generated successfully',
      response: aiResponse,
      feedback,
      sessionId
    });
  } catch (error) {
    console.error('AI chat error:', error);
    // Final fallback so the UI still works even if OpenAI or DB fail unexpectedly
    const safeMessage = req.body?.message || '';
    const aiResponse = generateMockResponse(safeMessage, '');
    const feedback = getFallbackFeedback(safeMessage);

    res.status(200).json({
      message: 'AI response generated with fallback',
      response: aiResponse,
      feedback,
      sessionId: req.body?.sessionId
    });
  }
});

// Voice-to-text conversion
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'Speech transcription is not configured on the server.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.file.path;

    // Transcribe audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: require('fs').createReadStream(audioFile),
      model: 'whisper-1',
      language: 'en'
    });

    // Clean up uploaded file
    require('fs').unlinkSync(audioFile);

    res.json({
      message: 'Audio transcribed successfully',
      text: transcription.text
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Server error transcribing audio' });
  }
});

// Text-to-speech conversion
router.post('/synthesize', auth, [
  body('text').trim().notEmpty(),
  body('voice').optional().isIn(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, voice = 'alloy' } = req.body;

    if (!openai) {
      return res.status(503).json({ error: 'Text-to-speech is not configured on the server.' });
    }

    // Generate speech using OpenAI TTS
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text
    });

    // Convert to base64 for frontend
    const buffer = Buffer.from(await speech.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    res.json({
      message: 'Speech synthesized successfully',
      audio: base64Audio,
      format: 'mp3'
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    res.status(500).json({ error: 'Server error synthesizing speech' });
  }
});

// Analyze user response for feedback
async function analyzeUserResponse(text) {
  try {
    if (!openai) {
      return getFallbackFeedback(text);
    }

    const analysis = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analyze the following interview response and provide feedback on:
          1. Grammar and clarity (excellent/good/fair/needs_improvement)
          2. Confidence level (0-10 scale)
          3. Brief constructive notes
          
          Respond in JSON format:
          {
            "grammar": "excellent|good|fair|needs_improvement",
            "confidence": 0-10,
            "notes": "brief feedback"
          }`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const feedbackText = analysis.choices[0].message.content;
    return JSON.parse(feedbackText);
  } catch (error) {
    console.error('Response analysis error:', error);
    return {
      grammar: 'good',
      confidence: 7,
      notes: 'Unable to analyze response'
    };
  }
}

// Get role prompt suggestions
router.get('/role-prompts', auth, async (req, res) => {
  try {
    const rolePrompts = [
      {
        id: 'hr-google',
        title: 'HR at Google',
        prompt: 'You are an HR interviewer at Google conducting a technical interview. Focus on problem-solving skills, cultural fit, and technical knowledge. Ask behavioral and technical questions.'
      },
      {
        id: 'tech-lead',
        title: 'Tech Lead',
        prompt: 'You are a senior tech lead interviewing a developer for a team position. Assess technical skills, architecture thinking, and leadership potential. Ask about past projects and technical challenges.'
      },
      {
        id: 'startup-founder',
        title: 'Startup Founder',
        prompt: 'You are a startup founder looking for a co-founder or early employee. Focus on passion, adaptability, and growth mindset. Ask about risk tolerance and long-term vision.'
      },
      {
        id: 'sales-manager',
        title: 'Sales Manager',
        prompt: 'You are a sales manager interviewing for a sales position. Assess communication skills, persuasion ability, and customer focus. Ask about past sales achievements and handling objections.'
      },
      {
        id: 'product-manager',
        title: 'Product Manager',
        prompt: 'You are a product manager interviewing for a PM role. Focus on product thinking, user empathy, and strategic thinking. Ask about product decisions and user research.'
      },
      {
        id: 'custom',
        title: 'Custom Role',
        prompt: 'You are conducting a professional interview. Adapt your questions based on the candidate\'s responses and provide constructive feedback.'
      }
    ];

    res.json({ rolePrompts });
  } catch (error) {
    console.error('Get role prompts error:', error);
    res.status(500).json({ error: 'Server error getting role prompts' });
  }
});

module.exports = router; 