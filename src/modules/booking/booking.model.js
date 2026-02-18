const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

// Passenger schema
const passengerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  seatNumber: {
    type: String,
    required: true
  }
});

// Booking schema
const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  seats: [{
    type: String,
    required: true
  }],
  passengers: [passengerSchema],
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  journeyDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ userId: 1 });
bookingSchema.index({ busId: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ journeyDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;