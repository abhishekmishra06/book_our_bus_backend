const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

// Notification schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'BOOKING_CONFIRMED',
      'BOOKING_CANCELLED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'SEAT_AVAILABILITY',
      'JOURNEY_REMINDER',
      'BOARDING_INFO',
      'ARRIVAL_INFO',
      'SYSTEM_MESSAGE',
      'PROMOTIONAL',
      'LOGIN_ATTEMPT',
      'SECURITY_ALERT'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  channel: {
    type: String,
    enum: ['SMS', 'EMAIL', 'PUSH', 'IN_APP'],
    required: true
  },
  recipient: {
    phone: String,
    email: String
  },
  // payload: {
  //   bookingId: mongoose.Schema.Types.ObjectId,
  //   busId: mongoose.Schema.Types.ObjectId,
  //   routeId: mongoose.Schema.Types.ObjectId,
  //   additionalData: mongoose.Types.Mixed
  // },
  payload: {
    type: Object,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  sent: {
    type: Boolean,
    default: false
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ userId: 1, read: 1 }); // For user's unread notifications

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;