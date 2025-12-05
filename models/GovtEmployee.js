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
  },
  { timestamps: true }
);

module.exports = mongoose.model("GovtEmployee", govtEmployeeSchema);
