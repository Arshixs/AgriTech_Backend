const Farmer = require('../models/Farmer');
const { sendSMS } = require('../utils/twilio'); // Assuming a utility exists for sending SMS
const jwt = require('jsonwebtoken');

// 1. SEND OTP - Finds or creates a farmer record and sends an OTP
exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body; 

        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Generate a 6-digit OTP
        // const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp = "000000";
        const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 mins

        // Upsert Farmer: Find by phone or create new
        let farmer = await Farmer.findOne({ phone });

        if (!farmer) {
            farmer = new Farmer({ phone, otp, otpExpires });
        } else {
            farmer.otp = otp;
            farmer.otpExpires = otpExpires;
            // Optionally, we could reset isVerified here, but we keep it true for verified users
        }
        
        await farmer.save();

        // Send SMS via mock utility
        const message = `Your Agritech verification code is: ${otp}`;
        // In a real application, ensure the phone number is correctly formatted for Twilio/SMS provider
        // await sendSMS(phone, message); 

        res.status(200).json({ 
            message: 'OTP sent successfully', 
            phone,
            role: 'farmer' // Explicitly confirm role
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error sending OTP' });
    }
};

// 2. VERIFY OTP - Validates the OTP and logs the farmer in
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        const farmer = await Farmer.findOne({ phone });

        if (!farmer) {
            return res.status(404).json({ message: 'Farmer record not found' });
        }

        // Check if OTP matches and hasn't expired
        if (farmer.otp !== otp || farmer.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP fields and mark verified
        farmer.otp = undefined;
        farmer.otpExpires = undefined;
        farmer.isVerified = true;
        await farmer.save();

        // Generate JWT Token - Hardcoding the role as 'farmer'
        const token = jwt.sign(
            { userId: farmer._id, role: 'farmer' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Determine if the farmer needs to complete their profile (registration)
        // Checks if all required profile fields are present
        const isProfileComplete = !!(farmer.name && farmer.address && farmer.adharNumber);

        res.status(200).json({
            message: 'Login successful',
            token,
            isProfileComplete,
            farmer // Return the farmer object instead of generic 'user'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error verifying OTP' });
    }
};

// 3. UPDATE PROFILE - Completes the farmer's registration after initial login
exports.updateProfile = async (req, res) => {
    try {
        // req.user is set by the authMiddleware from the JWT payload
        const { userId } = req.user; 
        const { name, adharNumber, address, coordinates } = req.body;

        const farmer = await Farmer.findByIdAndUpdate(
            userId,
            {
                $set: {
                name,
                adharNumber,
                address,
                coordinates,
                isProfileComplete: true
                },
                $unset: { verificationDeadline: 1 }
            },
            { new: true, runValidators: true }
            ).lean();

        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        res.status(200).json({ 
            message: 'Profile updated successfully', 
            farmer 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error updating profile' });
    }
};