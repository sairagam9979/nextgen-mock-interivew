const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  interviewHistory: [{
    sessionId: {
      type: String,
      required: true
    },
    rolePrompt: {
      type: String,
      required: true
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
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active'
    }
  }],
  preferences: {
    voiceEnabled: {
      type: Boolean,
      default: true
    },
    defaultRolePrompt: {
      type: String,
      default: 'You are an HR interviewer conducting a professional interview. Ask relevant questions based on the candidate\'s responses and provide constructive feedback.'
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 