// usage.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/stats', analyticsController.getUsageStats);
router.get('/logs', analyticsController.getUsageLogs);
router.get('/traffic', analyticsController.getTrafficByApi);
module.exports = router;
