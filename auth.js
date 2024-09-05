const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const User = require('../models/user');
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Password validation
const validatePassword = (password) => /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.{6,})/.test(password);

// Signup route
router.post('/signup', async (req, res) => {
    const { username, email, password, phone } = req.body;

    if (!validatePassword(password)) {
        return res.status(400).render('signup', { error: 'Password must be > 6 characters, contain at least 1 uppercase letter, and 1 special character.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, phone });
        await user.save();
        res.redirect('/auth/request-otp');
    } catch (error) {
        res.status(500).render('signup', { error: 'Error creating user' });
    }
});

// Request OTP
router.post('/request-otp', async (req, res) => {
    const { email, phone } = req.body;

    if (!email && !phone) {
        return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const user = await User.findOne({ $or: [{ email }, { phone }] });
        if (!user) {
            console.log('User not found with provided email or phone');
            return res.status(400).json({ success: false, message: 'User not found' });
        }
        console.log('User found:', user);
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 3600000); // 1 hour expiry
        await user.save();

        if (email) {
            await transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}`,
            });
        } else if (phone) {
            await twilioClient.messages.create({
                body: `Your OTP code is ${otp}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });
        }

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error requesting OTP:', error); // Add logging for debugging
        res.status(500).json({ success: false, message: 'Error requesting OTP', error: error.message });
    }
});


module.exports = router;

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).render('otp', { error: 'Invalid or expired OTP' });
        }

        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.redirect('/auth/login');
    } catch (error) {
        res.status(500).send('Error verifying OTP');
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('login', { error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('login', { error: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/index');  // Redirect to home page or dashboard after login
    } catch (error) {
        res.status(500).render('login', { error: 'Error logging in' });
    }
});

module.exports = router;
