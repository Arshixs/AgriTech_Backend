// File: models/GovtEmployee.js

const mongoose = require("mongoose");

const govtEmployeeSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    department: {
      type: String,
      default: "Department of Agriculture",
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },

    phoneExtra: {
      type: String,
      trim: true,
    },

    homeAddress: {
      type: String,
      trim: true,
    },

    maritalStatus: {
      type: String,
      trim: true,
      enum: ["single", "married", "divorced", "widowed", "N/A"],
      default: "N/A",
    },

    accountNumber: {
      type: String,
      trim: true,
    },

    IFSCCode: {
      type: String,
      trim: true,
    },

    // New fields for profile completion and verification
    profileComplete: {
      type: Boolean,
      default: false,
    },

    // Document URLs
    documents: {
      idProof: {
        type: String, // URL or file path
      },
      addressProof: {
        type: String,
      },
      employmentLetter: {
        type: String,
      },
      qualificationCertificate: {
        type: String,
      },
    },

    // Verification status
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    verificationNotes: {
      type: String,
      trim: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Reference to admin who verified
    },

    verifiedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    // Existing fields
    otp: {
      type: String,
    },

    otpExpires: {
      type: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      default: "govt",
      immutable: true,
    },

    // Admin created flag
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GovtEmployee", govtEmployeeSchema);
