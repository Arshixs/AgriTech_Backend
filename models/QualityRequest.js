const mongoose = require("mongoose");

const qualityRequestSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },
    cropOutputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropOutput",
      required: true,
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropMaster",
      required: true,
    },

    // Request Details (from crop output)
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      required: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    storageLocation: String,

    // Status
    status: {
      type: String,
      enum: ["pending", "in-progress", "approved", "rejected"],
      default: "pending",
    },

    // Assignment
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedDate: Date,

    // Lab Information (NEW)
    labName: String,
    labLocation: String,
    labCertificationNumber: String,

    // Grading Results
    grade: {
      type: String,
      enum: [ "A", "B", "C","1","2","3","4","Special","Standard","General","Good","Fair","Ghani Cake", "Rejected"],
    },
    qualityParams: {
      moisture: Number,
      foreignMatter: Number,
      damagedGrains: Number,
      discoloredGrains: Number,
      weevilDamage: Number,
      otherDefects: String,
    },
    gradingNotes: String,
    rejectionReason: String,
    inspectionDate: Date,

    // Certificate
    certificateNumber: String,
    certificateQRCode: String,
    certificateIssueDate: Date,
  },
  { timestamps: true }
);

// Indexes
qualityRequestSchema.index({ status: 1 });
qualityRequestSchema.index({ farmerId: 1 });
qualityRequestSchema.index({ assignedOfficer: 1 });

module.exports = mongoose.model("QualityRequest", qualityRequestSchema);
