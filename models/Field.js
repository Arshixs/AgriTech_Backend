// models/Field.js (UPDATED)
// ============================================
const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    area: {
      type: Number,
      required: true,
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropMaster", // Changed from String to Reference
    },
    soilType: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },

    // Field Status
    status: {
      type: String,
      enum: ["Growing", "Preparing", "Harvesting", "Fallow"],
      default: "Fallow",
    },

    // Planting Information
    plantedDate: Date,
    expectedHarvest: Date,

    // Field Health & Monitoring
    health: Number,
    irrigation: {
      type: String,
      enum: ["Drip", "Sprinkler", "Flood", "Rainfed"],
    },

    color: String, // For map visualization
  },
  { timestamps: true }
);

module.exports = mongoose.model("Field", fieldSchema);
