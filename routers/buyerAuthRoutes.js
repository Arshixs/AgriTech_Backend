// File: routers/buyerAuthRoutes.js

const express = require("express");
const router = express.Router();
const {
  buyerExists,
  sendOtp,
  verifyOtp,
  updateProfile,
  getProfile,
} = require("../controllers/buyerAuthController");
const { protect } = require("../middleware/authMiddleware");

// Public Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/buyer-exist", buyerExists);

// Protected Routes (Requires JWT)
router.post("/update-profile", protect, updateProfile);
router.get("/profile", protect, getProfile);

module.exports = router;
