const Vendor = require("../models/Vendor");
const { sendSMS } = require("../utils/twilio");
const jwt = require("jsonwebtoken");

exports.vendorExists = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const vendor = await Vendor.findOne({ phone });

    if (!vendor) {
      return res.status(404).json({
        exists: false,
        message: "New Vendor!",
      });
    }

    return res.status(200).json({
      exists: true,
      role: vendor.role,
      message: "Returning Vendor! Welcome back",
    });
  } catch (error) {
    console.error("Error checking vendor existence:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 1. SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body; // 'role' might not be needed if this is strictly vendor controller

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    let vendor = await Vendor.findOne({ phone });

    if (!vendor) {
      // Create new Vendor (Profile fields will be empty initially)
      vendor = new Vendor({ phone, role: "vendor", otp, otpExpires });
    } else {
      vendor.otp = otp;
      vendor.otpExpires = otpExpires;
    }

    await vendor.save();

    // Send SMS
    const message = `Your Agritech verification code is: ${otp}`;
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

    const vendor = await Vendor.findOne({ phone });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.otp !== otp || vendor.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark verified
    vendor.otp = undefined;
    vendor.otpExpires = undefined;
    vendor.isVerified = true;
    await vendor.save();

    // Generate Token
    const token = jwt.sign(
      { vendorId: vendor._id, role: vendor.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // FIXED: Check for correct Vendor fields
    const isProfileComplete = !!(
      vendor.name &&
      vendor.organizationName &&
      vendor.gstNumber &&
      vendor.address
    );

    res.status(200).json({
      message: "Login successful",
      token,
      isProfileComplete,
      vendor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error verifying OTP" });
  }
};

// 3. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    // IMPORTANT: Ensure your authMiddleware adds 'req.vendor' or 'req.user' correctly
    const { vendorId } = req.user; // or req.vendor, depending on your middleware

    // FIXED: Destructure correct fields
    const { name, organizationName, gstNumber, address } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { name, organizationName, gstNumber, address },
      { new: true, runValidators: true } // runValidators ensures the new data is clean
    );

    res.status(200).json({ message: "Profile updated successfully", vendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating profile" });
  }
};
