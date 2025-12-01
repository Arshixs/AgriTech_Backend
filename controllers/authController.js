const User = require('../models/User');
const { sendSMS } = require('../utils/twilio');
const jwt = require('jsonwebtoken');

// 1. SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({ message: 'Phone and Role are required' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 mins

    // Upsert User: Create if new, Update if exists
    // We update role here in case a user wants to switch roles (optional logic)
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, role, otp, otpExpires });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.role = role; // Update role if they are logging in again
    }
    
    await user.save();

    // Send SMS via Twilio
    const message = `Your Agritech verification code is: ${otp}`;
    await sendSMS(phone, message);

    res.status(200).json({ 
      message: 'OTP sent successfully', 
      phone, 
      role 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error sending OTP' });
  }
};

// 2. VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP matches and hasn't expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields and mark verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and check if profile is complete
    const isProfileComplete = !!(user.name && user.address && user.adharNumber);

    res.status(200).json({
      message: 'Login successful',
      token,
      isProfileComplete,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error verifying OTP' });
  }
};

// 3. UPDATE PROFILE (After Verification)
exports.updateProfile = async (req, res) => {
  try {
    // req.user comes from the authMiddleware (see next file)
    const { userId } = req.user;
    const { name, adharNumber, address } = req.body;

    const user = await User.findByIdAndUpdate(
      userId, 
      { name, adharNumber, address }, 
      { new: true }
    );

    res.status(200).json({ message: 'Profile updated successfully', user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating profile' });
  }
};
