const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, getBookingById, updateBooking, cancelBooking } = require('./booking.controller');

// Routes
router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

module.exports = router;