// File: models/Buyer.js

const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    // --- 1. Identity & Auth ---
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // --- 2. Business Profile ---
    // NOTE: Not required during initial OTP signup, filled during registration
    companyName: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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
      default: "buyer",
      immutable: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);
