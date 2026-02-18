const mongoose = require('mongoose');
const { validatePhoneNumber } = require('../../shared-services/utils/phoneValidator');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return validatePhoneNumber(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: false, // Not required as per PRD - only phone number is primary
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    enum: ['USER', 'AGENT'],
    default: 'USER',
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'VERIFIED'],
    default: 'ACTIVE',
    required: true
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Indexes for better query performance
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Pre-save middleware to ensure phone number is properly formatted
userSchema.pre('save', function(next) {
  // Normalize phone number (remove spaces, dashes, etc.)
  if (this.phone) {
    this.phone = this.phone.replace(/[\s\-\(\)]/g, '');
  }
  next();
});

// Virtual for getting the full name
userSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);