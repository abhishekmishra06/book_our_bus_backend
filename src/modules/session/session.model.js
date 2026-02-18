const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

// Session schema to track multiple device sessions per user
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceInfo: {
    type: {
      deviceId: String, // Unique identifier for the device
      deviceType: String, // mobile, web, tablet, etc.
      deviceModel: String, // Specific model
      os: String, // Operating system
      browser: String, // Browser name if web
      userAgent: String // Full user agent string
    }
  },
  ip: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ userId: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ userId: 1, isActive: 1 }); // For finding active sessions of a user
sessionSchema.index({ expiresAt: 1 }); // For cleanup

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;