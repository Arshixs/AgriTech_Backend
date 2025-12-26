const express = require("express");
const router = express.Router();
const {
  vendorExists, // FIXED: Added 's' to match controller export
  sendOtp,
  verifyOtp,
  updateProfile,
  getProfile,
} = require("../controllers/vendorAuthController"); // FIXED: Pointing to the correct vendor file
const { protect } = require("../middleware/authMiddleware");

// Public Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// FIXED: Changed GET to POST because the controller reads 'req.body.phone'
router.post("/vendor-exist", vendorExists);

// Protected Routes (Requires JWT)
router.post("/update-profile", protect, updateProfile);
router.get("/my", protect, getProfile);

module.exports = router;