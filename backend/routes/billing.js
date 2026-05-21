const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { protect } = require('../middleware/auth');

router.get('/plans', billingController.getPlans);
router.use(protect);
router.get('/usage', billingController.getCurrentUsage);
router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.post('/upgrade', billingController.upgradePlan);

module.exports = router;
