// File: routers/buyerAuthRoutes.js

const express = require("express");
const router = express.Router();
const {
  buyerExists,
  sendOtp,
  verifyOtp,
  updateProfile,
  getProfile,
  createProfile
} = require("../controllers/buyerAuthController");
const { protect } = require("../middleware/authMiddleware");

// Public Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/buyer-exist", buyerExists);

// // Protected Routes (Requires JWT)
// router.post("/create-profile",createProfile);
router.post("/update-profile", protect, updateProfile);
router.get("/profile", protect, getProfile);

router.get("/health",(req,res,next)=>{
  res.status(200).json({
    "status":"OK"
  })
})
module.exports = router;
