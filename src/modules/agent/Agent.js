const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  gst: { type: String, required: true, trim: true, uppercase: true },
  bankDetails: {
    accountNumber: { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    ifsc: { type: String, required: true, trim: true, uppercase: true },
    bankName: { type: String, required: true, trim: true },
    branchName: { type: String, required: true, trim: true }
  },
  supportContact: { type: String, required: true, trim: true },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    pincode: { type: String, required: true, trim: true }
  },
  verificationStatus: { type: String, enum: ['PENDING','VERIFIED','REJECTED'], default: 'PENDING' },
  documents: [{ type: { type: String }, url: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

agentSchema.index({ userId: 1 });
agentSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Agent', agentSchema);
