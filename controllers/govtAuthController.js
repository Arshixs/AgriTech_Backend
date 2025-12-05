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
      // Create new Government Employee automatically
      employee = new GovtEmployee({
        phone,
        role: "govt",
        otp,
        otpExpires,
      });
    } else {
      employee.otp = otp;
      employee.otpExpires = otpExpires;
    }

    await employee.save();

    // Send SMS
    const message = `Your Government Portal verification code is: ${otp}`;
    await sendSMS(phone, message);

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

// 4. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { govtId } = req.user;
    const { name, employeeId, department, designation } = req.body;

    const employee = await GovtEmployee.findByIdAndUpdate(
      govtId,
      { name, employeeId, department, designation },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating profile" });
  }
};
