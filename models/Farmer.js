const mongoose = require('mongoose');

// The Farmer model holds all authentication and profile data specific to a farmer user.
const farmerSchema = new mongoose.Schema({
 phone: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  index: true,
 },
 
 // --- Profile Information (Collected during registration) ---
 name: { 
  type: String,
  trim: true,
  // Setting to optional, as it's collected in the registration step
 },
 adharNumber: { 
  type: String,
  // Assuming this is an optional field for registration initially
 },
 address: { 
  type: String 
 },
 
 coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
 // --- OTP Fields (Temporary) ---
 otp: { 
  type: String 
 },
 otpExpires: { 
  type: Date 
 },
 
 // --- Account Status ---
 isVerified: {
  type: Boolean,
  default: false
 }
}, { 
 timestamps: true,
 // Explicitly setting the collection name, though Mongoose usually pluralizes 'Farmer' correctly
 collection: 'farmers' 
});

module.exports = mongoose.model('Farmer', farmerSchema);