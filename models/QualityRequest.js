// File: models/QualityRequest.js

const mongoose = require("mongoose");

const qualityRequestSchema = new mongoose.Schema(
  {
    // Farmer and Field Information
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },

    // Crop Details
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "quintal",
      enum: ["quintal", "kg", "ton"],
    },
    harvestDate: {
      type: Date,
      required: true,
    },

    // Request Status
    status: {
      type: String,
      enum: ["pending", "in-progress", "approved", "rejected"],
      default: "pending",
    },

    // Government Officer Assignment
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovtEmployee",
    },
    inspectionDate: {
      type: Date,
    },

    // Quality Grading Results (filled by officer)
    grade: {
      type: String,
      enum: ["FAQ", "A", "B", "C", "Rejected", null],
      default: null,
    },

    // Quality Parameters (as per AGMARK standards)
    qualityParams: {
      moisture: { type: Number }, // Percentage
      foreignMatter: { type: Number }, // Percentage
      damagedGrains: { type: Number }, // Percentage
      discoloredGrains: { type: Number }, // Percentage
      weevilDamage: { type: Number }, // Percentage
      otherDefects: { type: String },
    },

    // Grading Details
    gradingNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },

    // Certificate
    certificateNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null values
    },
    certificateIssueDate: {
      type: Date,
    },
    certificateQRCode: {
      type: String, // Base64 or URL
    },

    // Location
    storageLocation: {
      type: String,
    },
  },
  { timestamps: true }
);

// Generate unique certificate number before save
qualityRequestSchema.pre("save", function (next) {
  try {
    if (
      this.isModified("grade") &&
      this.grade &&
      this.grade !== "Rejected" &&
      !this.certificateNumber
    ) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const random = Math.floor(1000 + Math.random() * 9000);
      this.certificateNumber = `QC${year}${month}${random}`;
      this.certificateIssueDate = new Date();
    }
    //next();
  } catch (error) {
    next(error);
  }
});

// Indexes for faster queries
qualityRequestSchema.index({ farmerId: 1, status: 1 });
qualityRequestSchema.index({ assignedOfficer: 1, status: 1 });
qualityRequestSchema.index({ certificateNumber: 1 });

module.exports = mongoose.model("QualityRequest", qualityRequestSchema);
