// File: controllers/govtAuthController.js

const GovtEmployee = require("../models/GovtEmployee");
const { sendSMS } = require("../utils/twilio");
const jwt = require("jsonwebtoken");

// 1. SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    let employee = await GovtEmployee.findOne({ phone });

    if (!employee) {
      // Only allow login if employee was created by admin
      return res.status(404).json({
        message: "Employee not found. Please contact administrator.",
      });
    }

    employee.otp = "000000"; // For development
    employee.otpExpires = otpExpires;
    await employee.save();

    // Send SMS
    const message = `Your Government Portal verification code is: ${otp}`;
    // await sendSMS(phone, message);

    res.status(200).json({
      message: "OTP sent successfully",
      phone,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error sending OTP" });
  }
};

// 2. VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const employee = await GovtEmployee.findOne({ phone });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.otp !== otp || employee.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark verified
    employee.otp = undefined;
    employee.otpExpires = undefined;
    employee.isVerified = true;
    await employee.save();

    // Generate Token
    const token = jwt.sign(
      { govtId: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      employee: {
        id: employee._id,
        phone: employee.phone,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        role: employee.role,
        profileComplete: employee.profileComplete,
        verificationStatus: employee.verificationStatus,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error verifying OTP" });
  }
};

// 3. GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const { govtId } = req.user;

    const employee = await GovtEmployee.findById(govtId).select(
      "-otp -otpExpires"
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error fetching profile" });
  }
};

// // 4. COMPLETE PROFILE - New endpoint
// exports.completeProfile = async (req, res) => {
//   try {
//     const { govtId } = req.user;
//     const {
//       name,
//       email,
//       // employeeId,
//       //designation,
//       homeAddress,
//       maritalStatus,
//       accountNumber,
//       IFSCCode,
//       phone,
//       documents,
//     } = req.body;

//     // Validate required fields
//     if (!name || !email) {
//       return res.status(400).json({
//         message: "Name, Email are required",
//       });
//     }

//      const employee = await GovtEmployee.findOne({ phone });

//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     if (employee.profileComplete) {
//       return res.status(400).json({
//         message: "Profile already completed",
//       });
//     }

//     // Update employee details
//     employee.name = name;
//     employee.email = email;
//     //employee.employeeId = employeeId;
//     //employee.designation = designation;
//     employee.homeAddress = homeAddress;
//     employee.maritalStatus = maritalStatus;
//     employee.accountNumber = accountNumber;
//     employee.IFSCCode = IFSCCode;
//     employee.documents = documents;
//     employee.profileComplete = true;
//     employee.verificationStatus = "pending";

//     await employee.save();

//     res.status(200).json({
//       message: "Profile completed successfully. Awaiting admin verification.",
//       employee: {
//         id: employee._id,
//         name: employee.name,
//         email: employee.email,
//         profileComplete: employee.profileComplete,
//         verificationStatus: employee.verificationStatus,
//       },
//     });
//   } catch (error) {
//     console.error("Complete Profile Error:", error);
//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern || {})[0];
//       return res.status(400).json({
//         message: `${field} already exists`,
//       });
//     }
//     res.status(500).json({ message: "Server Error completing profile" });
//   }
// };
// File: controllers/govtAuthController.js (Updated completeProfile function)

// Add this validation function at the top
const isValidFirebaseUrl = (url) => {
  return url && url.startsWith('https://firebasestorage.googleapis.com');
};

// 4. COMPLETE PROFILE - Updated with Firebase URL validation
exports.completeProfile = async (req, res) => {
  try {
    const { govtId } = req.user;
    const {
      name,
      email,
      //designation,
      homeAddress,
      maritalStatus,
      accountNumber,
      IFSCCode,
      phone,
      documents,
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and Email are required",
      });
    }

    // Validate documents
    if (!documents || !documents.idProof || !documents.addressProof) {
      return res.status(400).json({
        message: "ID Proof and Address Proof are required",
      });
    }

    // Validate Firebase URLs
    if (!isValidFirebaseUrl(documents.idProof) || 
        !isValidFirebaseUrl(documents.addressProof)) {
      return res.status(400).json({
        message: "Invalid document URLs. Please upload documents again.",
      });
    }

    const employee = await GovtEmployee.findOne({ phone });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.profileComplete) {
      return res.status(400).json({
        message: "Profile already completed",
      });
    }

    // Update employee details
    employee.name = name;
    employee.email = email;
    //employee.designation = designation;
    employee.homeAddress = homeAddress;
    employee.maritalStatus = maritalStatus;
    employee.accountNumber = accountNumber;
    employee.IFSCCode = IFSCCode;
    employee.documents = {
      idProof: documents.idProof,
      addressProof: documents.addressProof,
      employmentLetter: documents.employmentLetter || null,
      qualificationCertificate: documents.qualificationCertificate || null,
    };
    employee.profileComplete = true;
    employee.verificationStatus = "pending";

    await employee.save();

    res.status(200).json({
      message: "Profile completed successfully. Awaiting admin verification.",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        profileComplete: employee.profileComplete,
        verificationStatus: employee.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        message: `${field} already exists`,
      });
    }
    res.status(500).json({ message: "Server Error completing profile" });
  }
};

// 5. UPDATE PROFILE (for verified users)
exports.updateGovtProfile = async (req, res) => {
  try {
    const govtId = req.user && req.user.govtId;

    if (!govtId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const employee = await GovtEmployee.findById(govtId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Only allow updates if profile is complete and verified
    if (
      !employee.profileComplete ||
      employee.verificationStatus !== "verified"
    ) {
      return res.status(403).json({
        message: "Profile must be verified before updates",
      });
    }

    const allowed = [
      "name",
      "email",
      "homeAddress",
      "maritalStatus",
      "accountNumber",
      "IFSCCode",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided to update",
      });
    }

    const updatedEmployee = await GovtEmployee.findByIdAndUpdate(
      govtId,
      { $set: updates },
      { new: true, runValidators: true, context: "query" }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("updateGovtProfile error:", error);
    if (error.code && error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({ message: `${key} already exists` });
    }
    return res.status(500).json({ message: "Server error updating profile" });
  }
};

// 6. ADMIN - Create Employee (New endpoint)
exports.adminCreateEmployee = async (req, res) => {
  try {
    // This would be protected by admin authentication middleware
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Check if employee already exists
    const existingEmployee = await GovtEmployee.findOne({ phone });
    if (existingEmployee) {
      return res.status(400).json({
        message: "Employee with this phone number already exists",
      });
    }

    // Create new employee with minimal info
    const employee = new GovtEmployee({
      phone,
      createdByAdmin: true,
      profileComplete: false,
      verificationStatus: "pending",
    });

    await employee.save();

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        phone: employee.phone,
      },
    });
  } catch (error) {
    console.error("Admin Create Employee Error:", error);
    res.status(500).json({ message: "Server error creating employee" });
  }
};

// 7. ADMIN - Verify Employee (New endpoint)
exports.adminVerifyEmployee = async (req, res) => {
  try {
    // This would be protected by admin authentication middleware
    const { employeeId } = req.params;
    const { action, notes, rejectionReason } = req.body;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({
        message: "Action must be either 'verify' or 'reject'",
      });
    }

    const employee = await GovtEmployee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.profileComplete) {
      return res.status(400).json({
        message: "Employee has not completed their profile",
      });
    }

    if (action === "verify") {
      employee.verificationStatus = "verified";
      employee.verifiedAt = new Date();
      employee.verifiedBy = req.user.adminId; // Assuming admin middleware adds this
      employee.verificationNotes = notes;
    } else {
      employee.verificationStatus = "rejected";
      employee.rejectionReason = rejectionReason;
    }

    await employee.save();

    res.status(200).json({
      message: `Employee ${
        action === "verify" ? "verified" : "rejected"
      } successfully`,
      employee: {
        id: employee._id,
        name: employee.name,
        verificationStatus: employee.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Admin Verify Employee Error:", error);
    res.status(500).json({ message: "Server error verifying employee" });
  }
};

// 8. ADMIN - Get Pending Verifications (New endpoint)
exports.adminGetPendingVerifications = async (req, res) => {
  try {
    const pendingEmployees = await GovtEmployee.find({
      profileComplete: true,
      verificationStatus: "pending",
    }).select("-otp -otpExpires");

    res.status(200).json({
      count: pendingEmployees.length,
      employees: pendingEmployees,
    });
  } catch (error) {
    console.error("Get Pending Verifications Error:", error);
    res.status(500).json({ message: "Server error fetching verifications" });
  }
};
