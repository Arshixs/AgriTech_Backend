// File: routers/govtAuthRoutes.js

const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  getProfile,
  updateGovtProfile,
  completeProfile,
  adminCreateEmployee,
  adminVerifyEmployee,
  adminGetPendingVerifications,
} = require("../controllers/govtAuthController");
const { protect } = require("../middleware/authMiddleware");
// const { protectAdmin } = require("../middleware/adminMiddleware"); // You'll need to create this

// Public Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Protected Employee Routes
router.get("/profile", protect, getProfile);
router.post("/complete-profile", protect, completeProfile);
router.post("/update-profile", protect, updateGovtProfile);

// Admin Routes (would need admin authentication middleware)
router.post("/admin/create-employee", adminCreateEmployee); // Add protectAdmin middleware
router.post("/admin/verify-employee/:employeeId", adminVerifyEmployee); // Add protectAdmin
router.get("/admin/pending-verifications", adminGetPendingVerifications); // Add protectAdmin

module.exports = router;
