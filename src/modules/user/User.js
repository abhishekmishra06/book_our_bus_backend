const mongoose = require('mongoose');
const { validatePhoneNumber } = require('../../../src/shared/utils/phoneValidator');

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
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: false, lowercase: true, trim: true },
  role: { type: String, enum: ['USER','AGENT'], default: 'USER', required: true },
  status: { type: String, enum: ['ACTIVE','INACTIVE','SUSPENDED','VERIFIED'], default: 'ACTIVE', required: true }
}, { timestamps: true });

userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.pre('save', function(next) {
  if (this.phone) this.phone = this.phone.replace(/[\s\-\(\)]/g, '');
  next();
});

userSchema.virtual('fullName').get(function() { return `${this.name}`; });

userSchema.set('toJSON', { virtuals: true, transform: function(doc, ret) { delete ret.__v; return ret; } });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
