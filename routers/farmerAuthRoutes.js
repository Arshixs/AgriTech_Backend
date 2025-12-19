const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, updateProfile,getProfile } = require('../controllers/farmerAuthController');
const { protect } = require('../middleware/authMiddleware'); 

// --- Public Routes ---

router.post('/send-otp', sendOtp);      //api/farmer-auth/sendOtp-otp
router.post('/verify-otp', verifyOtp);  //api/farmer-auth/verify-otp

// --- Protected Route (Registration / Profile Completion) ---
router.post('/register', protect, updateProfile);
router.get('/profile', protect, getProfile);

module.exports = router;