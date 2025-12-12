// File: controllers/buyerAuthController.js

const Buyer = require("../models/Buyer");
const { sendSMS } = require("../utils/twilio");
const jwt = require("jsonwebtoken");

// Check if buyer exists
exports.buyerExists = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const buyer = await Buyer.findOne({ phone });

    if (!buyer) {
      return res.status(404).json({
        exists: false,
        message: "New Buyer!",
      });
    }

    return res.status(200).json({
      exists: true,
      role: buyer.role,
      message: "Returning Buyer! Welcome back",
    });
  } catch (error) {
    console.error("Error checking buyer existence:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

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

    let buyer = await Buyer.findOne({ phone });

    if (!buyer) {
      // Create new Buyer (Profile fields will be empty initially)
      buyer = new Buyer({ phone, role: "buyer", otp, otpExpires });
    } else {
      buyer.otp = "000000";
      buyer.otpExpires = otpExpires;
    }

    await buyer.save();

    // Send SMS
    const message = `Your Buyer verification code is: ${otp}`;
    //await sendSMS(phone, message);

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

    const buyer = await Buyer.findOne({ phone });

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    if (buyer.otp !== otp || buyer.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark verified
    buyer.otp = undefined;
    buyer.otpExpires = undefined;
    buyer.isVerified = true;
    await buyer.save();

    // Generate Token
    const token = jwt.sign(
      { buyerId: buyer._id, role: buyer.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Check if profile is complete
    const isProfileComplete = !!(
      buyer.companyName &&
      buyer.contactPerson &&
      buyer.email
    );

    res.status(200).json({
      message: "Login successful",
      token,
      isProfileComplete,
      buyer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error verifying OTP" });
  }
};

// 3. UPDATE PROFILE (Complete Registration)
exports.updateProfile = async (req, res) => {
  try {
    const { buyerId } = req.user; // From authMiddleware

    const { companyName, contactPerson, email } = req.body;

    // Validate required fields
    if (!companyName || !contactPerson || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email is already used by another buyer
    const existingBuyer = await Buyer.findOne({ 
      email, 
      _id: { $ne: buyerId } 
    });

    if (existingBuyer) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const buyer = await Buyer.findByIdAndUpdate(
      buyerId,
      { companyName, contactPerson, email },
      { new: true, runValidators: true }
    );

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    res.status(200).json({ 
      message: "Profile updated successfully", 
      buyer 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating profile" });
  }
};

// 4. GET BUYER PROFILE
exports.getProfile = async (req, res) => {
  try {
    const { buyerId } = req.user; // From authMiddleware

    const buyer = await Buyer.findById(buyerId).select('-otp -otpExpires');

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    res.status(200).json({ buyer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error fetching profile" });
  }
};