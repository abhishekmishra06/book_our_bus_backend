const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {



    type: String,
    type: String,
    trim: true,
    lowercase: true

  },
  role: {
    type: String,
    enum: ['USER', 'AGENT', 'ADMIN'],
    default: 'USER'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Indexes for better query performance
userSchema.index({ phone: 1 });
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $exists: true, $ne: null } }
  }
);


// Pre-save middleware for any processing if needed
userSchema.pre('save', function (next) {
  // Any preprocessing before saving
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;