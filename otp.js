const express = require('express');
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

// Request OTP
router.post('/request-otp', async (req, res) => {
    const { email, phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('User not found');
        }

        user.otp = otp;
        user.otpExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        if (email) {
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}`,
            };

            await transporter.sendMail(mailOptions);
        } else if (phone) {
            await twilioClient.messages.create({
                body: `Your OTP code is ${otp}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });
        }

        res.render('otp', { title: 'Enter OTP' });
    } catch (error) {
        res.status(500).send('Error requesting OTP');
    }
});

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

        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error verifying OTP');
    }
});

module.exports = router;
