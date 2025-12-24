const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const VendorProduct = require("../models/VendorProduct");
const { sendSMS } = require("../utils/twilio");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

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
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = "000000";
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

exports.getProfile = async (req, res) => {
  try {
    const { vendorId } = req.user;

    // A. Fetch Vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // B. Calculate Stats
    // 1. Monthly Revenue (Completed orders this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const revenueStats = await Order.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(vendorId),
          status: "completed",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);
    const monthlyRevenue =
      revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // 2. Active Orders (Accepted)
    const activeOrdersCount = await Order.countDocuments({
      vendor: vendorId,
      status: { $in: ["accepted"] },
    });

    // 3. Pending Orders (Pending)
    const pendingOrdersCount = await Order.countDocuments({
      vendor: vendorId,
      status: { $in: ["pending"] },
    });

    // C. Fetch 5 Most Recent Orders
    const recentOrders = await Order.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("farmer", "name")
      .populate("product", "name");

    res.status(200).json({
      message: "Profile retrieved successfully",
      vendor,
      stats: {
        monthlyRevenue,
        activeOrders: activeOrdersCount,
        pendingOrders: pendingOrdersCount,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server Error fetching profile" });
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
