const Invoice = require('../models/Invoice');
const UsageLog = require('../models/UsageLog');
const Api = require('../models/Api');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const billingService = require('../services/billingService');

exports.getCurrentUsage = async (req, res, next) => {
  try {
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageByApi = await UsageLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          billingPeriod,
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$apiId',
          totalRequests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' },
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

    const totalRequests = usageByApi.reduce((sum, u) => sum + u.totalRequests, 0);
    const planLimit = req.user.planLimits.requestsPerMonth;
    const estimatedCost = await billingService.calculateCost(req.user, usageByApi);

    res.json({
      status: 'success',
      data: {
        billingPeriod,
        totalRequests,
        planLimit,
        usagePercent: Math.min(100, Math.round((totalRequests / planLimit) * 100)),
        estimatedCost,
        usageByApi,
        plan: req.user.plan,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return next(new AppError('Invoice not found.', 404));
    res.json({ status: 'success', data: { invoice } });
  } catch (error) {
    next(error);
  }
};

exports.getPlans = async (req, res) => {
  res.json({
    status: 'success',
    data: {
      plans: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'INR',
          billing: 'monthly',
          features: {
            requestsPerMonth: 1000,
            requestsPerMinute: 60,
            apisAllowed: 3,
            analytics: 'basic',
            support: 'community',
            webhooks: false,
            customDomain: false,
          },
          stripePriceId: null,
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 999,
          currency: 'INR',
          billing: 'monthly',
          features: {
            requestsPerMonth: 100000,
            requestsPerMinute: 600,
            apisAllowed: 20,
            analytics: 'advanced',
            support: 'email',
            webhooks: true,
            customDomain: false,
          },
          stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
          overage: { per100Requests: 0.5 },
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 4999,
          currency: 'INR',
          billing: 'monthly',
          features: {
            requestsPerMonth: 10000000,
            requestsPerMinute: 6000,
            apisAllowed: 999,
            analytics: 'enterprise',
            support: 'dedicated',
            webhooks: true,
            customDomain: true,
          },
          stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
          overage: { per100Requests: 0.1 },
        },
      ],
    },
  });
};

exports.upgradePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return next(new AppError('Invalid plan.', 400));
    }

    // In production, this would create a Stripe checkout session
    // For now, directly update the user's plan
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan },
      { new: true }
    );

    res.json({
      status: 'success',
      message: `Successfully upgraded to ${plan} plan.`,
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};
