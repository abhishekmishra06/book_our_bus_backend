const express = require('express');
const router = express.Router();
const { createBus, getAllBuses, getBusById, updateBus, deleteBus } = require('./bus.controller');

// Routes
router.post('/', createBus);
router.get('/', getAllBuses);
router.get('/:id', getBusById);
router.put('/:id', updateBus);
router.delete('/:id', deleteBus);

module.exports = router;