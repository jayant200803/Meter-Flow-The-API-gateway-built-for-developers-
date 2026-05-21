const Invoice = require('../models/Invoice');
const UsageLog = require('../models/UsageLog');
const Api = require('../models/Api');
const logger = require('../utils/logger');

const PRICING = {
  free: { pricePerRequest: 0, freeTier: 1000 },
  pro: { pricePerRequest: 0.005, freeTier: 0 }, // ₹0.005 per request = ₹0.5 per 100
  enterprise: { pricePerRequest: 0.001, freeTier: 0 },
};

exports.calculateCost = async (user, usageByApi) => {
  const pricing = PRICING[user.plan] || PRICING.free;
  let totalCost = 0;

  for (const usage of usageByApi) {
    const billable = Math.max(0, usage.totalRequests - pricing.freeTier);
    totalCost += billable * pricing.pricePerRequest;
  }

  return {
    amount: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    currency: 'INR',
    breakdown: usageByApi.map(u => ({
      apiId: u._id,
      apiName: u.api?.name || 'Unknown',
      totalRequests: u.totalRequests,
      billableRequests: Math.max(0, u.totalRequests - pricing.freeTier),
      cost: Math.round(Math.max(0, u.totalRequests - pricing.freeTier) * pricing.pricePerRequest * 100) / 100,
    })),
  };
};

exports.generateMonthlyInvoice = async (userId, billingPeriod) => {
  try {
    const [year, month] = billingPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    // Check if invoice already exists
    const existing = await Invoice.findOne({ userId, billingPeriod });
    if (existing) {
      logger.info(`Invoice already exists for ${userId} - ${billingPeriod}`);
      return existing;
    }

    // Get usage data
    const usageByApi = await UsageLog.aggregate([
      {
        $match: {
          userId,
          billingPeriod,
          createdAt: { $gte: periodStart, $lte: periodEnd },
        },
      },
      {
        $group: {
          _id: '$apiId',
          totalRequests: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'apis',
          localField: '_id',
          foreignField: '_id',
          as: 'api',
        },
      },
      { $unwind: { path: '$api', preserveNullAndEmptyArrays: true } },
    ]);

    const User = require('../models/User');
    const user = await User.findById(userId);
    const pricing = PRICING[user.plan] || PRICING.free;

    const lineItems = usageByApi.map(usage => {
      const billableRequests = Math.max(0, usage.totalRequests - pricing.freeTier);
      const amount = Math.round(billableRequests * pricing.pricePerRequest * 100); // in paise

      return {
        apiId: usage._id,
        apiName: usage.api?.name || 'Unknown API',
        totalRequests: usage.totalRequests,
        billableRequests,
        freeTierRequests: Math.min(usage.totalRequests, pricing.freeTier),
        pricePerRequest: pricing.pricePerRequest * 100, // in paise
        amount,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + tax;

    const invoice = await Invoice.create({
      userId,
      billingPeriod,
      periodStart,
      periodEnd,
      lineItems,
      subtotal,
      tax,
      total,
      currency: 'INR',
      status: total > 0 ? 'open' : 'paid',
      dueDate: new Date(year, month, 15), // Due on 15th of next month
    });

    // Mark logs as billed
    await UsageLog.updateMany(
      { userId, billingPeriod },
      { isBilled: true }
    );

    logger.info(`Invoice generated: ${invoice.invoiceNumber} for user ${userId}`);
    return invoice;

  } catch (error) {
    logger.error(`Invoice generation error for ${userId}: ${error.message}`);
    throw error;
  }
};
