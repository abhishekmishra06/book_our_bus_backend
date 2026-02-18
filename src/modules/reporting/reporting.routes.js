const express = require('express');
const router = express.Router();
const { getReportStatus } = require('./reporting.controller');

router.get('/', getReportStatus);

module.exports = router;
