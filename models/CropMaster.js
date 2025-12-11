// ============================================
// models/CropMaster.js
// ============================================
const mongoose = require("mongoose");

const cropMasterSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      unique: true,
    },
    season: {
      type: String,
      enum: ["kharif", "rabi", "year-round"],
      required: true,
    },
    // Basic crop information
    duration: String, // e.g., "90-120 days"
    waterRequirement: {
      type: String,
      enum: ["Low", "Medium", "High"],
    },
    soilType: [String], // e.g., ['Loamy', 'Clay']
    icon: String, // MaterialCommunityIcons name

    // MSP Information (if applicable)
    hasMSP: {
      type: Boolean,
      default: false,
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: String,
      enum: ["system", "government"],
      default: "system",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropMaster", cropMasterSchema);
