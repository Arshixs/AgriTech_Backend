const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected Routes (Requires JWT)
router.post('/update-profile', protect, updateProfile);


module.exports = router;
