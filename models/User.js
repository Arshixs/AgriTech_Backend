const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['farmer', 'vendor', 'buyer', 'government employee'],
    required: true,
  },
  // Profile Information (Collected after verification)
  name: { type: String },
  adharNumber: { type: String },
  address: { type: String },
  
  // OTP Fields (Temporary)
  otp: { type: String },
  otpExpires: { type: Date },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);