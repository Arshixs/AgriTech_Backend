// models/Sale.js
const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cropOutputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropOutput",
      required: true,
      unique: true, // One crop output can only be listed once
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropMaster",
      required: true,
    },
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },

    // Sale Type
    saleType: {
      type: String,
      enum: ["marketplace", "government_msp"],
      required: true,
    },

    // Product Details
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      required: true,
    },

    // Pricing
    minimumPrice: {
      type: Number, // For marketplace listings
      min: 0,
    },
    mspPrice: {
      type: Number, // For government sales
      min: 0,
    },

    // Quality Certificate (if available)
    hasQualityCertificate: {
      type: Boolean,
      default: false,
    },
    qualityRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QualityRequest",
    },
    qualityGrade: {
      type: String,
      enum: ["FAQ", "A", "B", "C"],
    },

    // Status
    status: {
      type: String,
      enum: ["active", "sold", "cancelled", "pending_govt_approval"],
      default: "active",
    },

    // Storage & Harvest Info
    harvestDate: {
      type: Date,
      required: true,
    },
    storageLocation: String,

    // Government MSP Sale specific
    govtRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovtProcurementRequest",
    },

    // Sale completion
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "soldToModel",
    },
    soldToModel: {
      type: String,
      enum: ["Buyer", "GovtEmployee"],
    },
    soldDate: Date,
    finalPrice: Number,

    // Listing metadata
    views: {
      type: Number,
      default: 0,
    },
    listedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
saleSchema.index({ status: 1, saleType: 1 });
saleSchema.index({ farmerId: 1, status: 1 });
saleSchema.index({ cropId: 1, status: 1 });

module.exports = mongoose.model("Sale", saleSchema);
