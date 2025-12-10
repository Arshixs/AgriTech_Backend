// File: routers/govtAuthRoutes.js

const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  updateGovtProfile,
} = require("../controllers/govtAuthController");
const { protect } = require("../middleware/authMiddleware");

// Public Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Protected Routes
router.get("/profile", protect, getProfile);
router.post("/update-profile", protect, updateGovtProfile);

module.exports = router;
