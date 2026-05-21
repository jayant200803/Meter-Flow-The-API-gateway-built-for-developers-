const cron = require('node-cron');
const User = require('../models/User');
const billingService = require('./billingService');
const logger = require('../utils/logger');

// Run on 1st of every month at 00:05 AM
cron.schedule('5 0 1 * *', async () => {
  logger.info('🧾 Starting monthly billing invoice generation...');

  try {
    const now = new Date();
    // Generate invoices for the PREVIOUS month
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const billingPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const users = await User.find({ isActive: true, plan: { $ne: 'free' } }).select('_id plan');

    logger.info(`Processing invoices for ${users.length} paid users - period: ${billingPeriod}`);

    let success = 0, failed = 0;
    for (const user of users) {
      try {
        await billingService.generateMonthlyInvoice(user._id, billingPeriod);
        success++;
      } catch (err) {
        logger.error(`Invoice generation failed for user ${user._id}: ${err.message}`);
        failed++;
      }
    }

    logger.info(`✅ Billing cron complete: ${success} success, ${failed} failed`);
  } catch (error) {
    logger.error(`❌ Billing cron error: ${error.message}`);
  }
}, {
  timezone: 'Asia/Kolkata',
});

// Clean up old memory store entries every hour
cron.schedule('0 * * * *', () => {
  logger.info('🧹 Running hourly cleanup...');
});

logger.info('📅 Billing cron jobs scheduled');

module.exports = {};
