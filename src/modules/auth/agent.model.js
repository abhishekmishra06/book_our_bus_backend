const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  aadharPhoto: {
    type: String, // URL or file path
    required: true
  },
  panCardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  panCardPhoto: {
    type: String, // URL or file path
    required: true
  },
  msme: {
    type: Boolean,
    default: false
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  corporateEntity: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  whatsappConsent: {
    type: Boolean,
    required: true,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  documents: [{
    type: {
      type: String,
      enum: ['AADHAR', 'PAN', 'GST', 'MSME', 'OTHER']
    },
    url: String,
    verified: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to hash password
agentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
agentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;