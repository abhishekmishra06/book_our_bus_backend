const express = require('express');
const router = express.Router();
const { getSeats } = require('./seat.controller');

router.get('/', getSeats);

module.exports = router;
