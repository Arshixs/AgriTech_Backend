const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    // --- 1. Identity & Auth ---
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // --- 2. Personal & Business Profile ---
    // NOTE: Removed "required: true" because these are empty during initial OTP signup
    name: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
    },

    // --- 3. Verification & Security ---
    otp: { type: String },
    otpExpires: { type: Date },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // --- 4. System Fields ---
    role: {
      type: String,
      default: "vendor",
      immutable: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
