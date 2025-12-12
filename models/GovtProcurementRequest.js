// models/GovtProcurementRequest.js
const mongoose = require("mongoose");

const govtProcurementRequestSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
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

    // Request Details
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    mspPrice: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // Quality Information
    hasQualityCertificate: {
      type: Boolean,
      default: false,
    },
    qualityGrade: String,

    // Request Status
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "payment_processing",
        "completed",
      ],
      default: "pending",
    },

    // Government Officer Assignment
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovtEmployee",
    },
    assignedDate: Date,

    // Review Details
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovtEmployee",
    },
    reviewDate: Date,
    reviewNotes: String,
    rejectionReason: String,

    // Payment Details
    paymentReferenceNumber: String,
    paymentDate: Date,
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    // Delivery/Pickup Details
    deliveryLocation: String,
    expectedPickupDate: Date,
    actualPickupDate: Date,
  },
  { timestamps: true }
);

// Indexes
govtProcurementRequestSchema.index({ farmerId: 1, status: 1 });
govtProcurementRequestSchema.index({ status: 1 });
govtProcurementRequestSchema.index({ assignedOfficer: 1 });

module.exports = mongoose.model(
  "GovtProcurementRequest",
  govtProcurementRequestSchema
);
