const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  gst: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: true,
      trim: true
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true
    },
    ifsc: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      description: 'IFSC code for Indian banks'
    },
    bankName: {
      type: String,
      required: true,
      trim: true
    },
    branchName: {
      type: String,
      required: true,
      trim: true
    }
  },
  supportContact: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid pincode']
    }
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
    required: true
  },
  documents: [{
    type: {
      type: String,
      required: true,
      enum: ['GST_CERTIFICATE', 'BANK_STATEMENT', 'BUS_LICENSE', 'INSURANCE', 'OTHER']
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
agentSchema.index({ userId: 1 });
agentSchema.index({ verificationStatus: 1 });
agentSchema.index({ companyName: 'text' }); // For text search

// Pre-save middleware to normalize data
agentSchema.pre('save', function(next) {
  if (this.gst) {
    this.gst = this.gst.toUpperCase();
  }
  if (this.bankDetails && this.bankDetails.ifsc) {
    this.bankDetails.ifsc = this.bankDetails.ifsc.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Agent', agentSchema);