const express = require('express');
const router = express.Router();
const { sendOTPController, verifyOTPController, refreshTokenController } = require('./auth.controller');

// Routes
router.post('/send-otp', sendOTPController);
router.post('/verify-otp', verifyOTPController);
// router.post('/refresh-token', refreshTokenController);

module.exports = router;