const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, updateProfile } = require('../controllers/farmerAuthController');
const { protect } = require('../middleware/authMiddleware'); 

// --- Public Routes ---

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// --- Protected Route (Registration / Profile Completion) ---
router.post('/register', protect, updateProfile);

module.exports = router;