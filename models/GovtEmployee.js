// // File: models/GovtEmployee.js

// const mongoose = require("mongoose");

// const govtEmployeeSchema = new mongoose.Schema(
//   {
//     phone: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },
//     name: {
//       type: String,
//       trim: true,
//     },
//     employeeId: {
//       type: String,
//       trim: true,
//     },
//     department: {
//       type: String,
//       default: "Department of Agriculture",
//       trim: true,
//     },
//     designation: {
//       type: String,
//       trim: true,
//     },
//     otp: {
//       type: String,
//     },
//     otpExpires: {
//       type: Date,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     role: {
//       type: String,
//       default: "govt",
//       immutable: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("GovtEmployee", govtEmployeeSchema);
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
      sparse: true, // allows null + unique
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
