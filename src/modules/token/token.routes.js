const express = require('express');
const router = express.Router();
const { refreshToken, revokeToken } = require('./token.controller');

// Routes
router.post('/refresh', refreshToken);
router.post('/revoke', revokeToken);

module.exports = router;