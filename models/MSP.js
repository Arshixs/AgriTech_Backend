// File: models/MSP.js

const mongoose = require("mongoose");

const mspSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "quintal",
      trim: true,
      lowercase: true,
    },
    season: {
      type: String,
      enum: ["kharif", "rabi", "year-round"],
      default: "year-round",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovtEmployee",
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
mspSchema.index({ cropName: 1 });
mspSchema.index({ isActive: 1 });

module.exports = mongoose.model("MSP", mspSchema);
