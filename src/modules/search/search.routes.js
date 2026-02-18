const express = require('express');
const router = express.Router();
const { searchBuses, getBusDetails, filterBuses } = require('./search.controller');

// Routes
router.get('/buses', searchBuses);
router.get('/buses/:id', getBusDetails);
router.get('/filter', filterBuses);

module.exports = router;