const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  inputType: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  audioUrl: {
    type: String
  },
  feedback: {
    grammar: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs_improvement'],
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    notes: {
      type: String
    }
  }
});

const interviewSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rolePrompt: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number, // in seconds
    default: 0
  },
  settings: {
    voiceEnabled: {
      type: Boolean,
      default: true
    },
    maxQuestions: {
      type: Number,
      default: 10
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30
    }
  },
  analytics: {
    averageResponseTime: {
      type: Number,
      default: 0
    },
    totalWords: {
      type: Number,
      default: 0
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
interviewSessionSchema.index({ userId: 1, startTime: -1 });
interviewSessionSchema.index({ sessionId: 1 });

// Method to add message
interviewSessionSchema.methods.addMessage = function(role, content, inputType = 'text', audioUrl = null) {
  this.messages.push({
    role,
    content,
    inputType,
    audioUrl,
    timestamp: new Date()
  });
  
  if (role === 'assistant') {
    this.totalQuestions += 1;
  }
  
  return this.save();
};

// Method to end session
interviewSessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.totalDuration = Math.floor((this.endTime - this.startTime) / 1000);
  return this.save();
};

// Method to calculate analytics
interviewSessionSchema.methods.calculateAnalytics = function() {
  const userMessages = this.messages.filter(msg => msg.role === 'user');
  const totalWords = userMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0);
  
  this.analytics.totalWords = totalWords;
  
  if (userMessages.length > 0) {
    const avgConfidence = userMessages.reduce((sum, msg) => sum + (msg.feedback?.confidence || 0), 0) / userMessages.length;
    this.analytics.confidenceScore = avgConfidence;
  }
  
  return this.save();
};

module.exports = mongoose.model('InterviewSession', interviewSessionSchema); 