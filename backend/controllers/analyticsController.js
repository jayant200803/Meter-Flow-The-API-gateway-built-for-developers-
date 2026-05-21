const UsageLog = require('../models/UsageLog');
const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalApis,
      activeKeys,
      monthStats,
      lastMonthStats,
      recentActivity,
      hourlyTraffic,
      errorRate,
    ] = await Promise.all([
      Api.countDocuments({ userId, status: 'active' }),
      ApiKey.countDocuments({ userId, status: 'active' }),
      UsageLog.aggregate([
        { $match: { userId, createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            errors: { $sum: { $cond: ['$isError', 1, 0] } },
            avgLatency: { $avg: '$latency' },
          },
        },
      ]),
      UsageLog.aggregate([
        { $match: { userId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, totalRequests: { $sum: 1 } } },
      ]),
      UsageLog.find({ userId })
        .sort('-createdAt')
        .limit(10)
        .populate('apiId', 'name icon color'),
      UsageLog.aggregate([
        { $match: { userId, createdAt: { $gte: last24h } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%dT%H:00:00', date: '$createdAt' },
            },
            requests: { $sum: 1 },
            errors: { $sum: { $cond: ['$isError', 1, 0] } },
            avgLatency: { $avg: '$latency' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UsageLog.aggregate([
        { $match: { userId, createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: '$apiId',
            total: { $sum: 1 },
            errors: { $sum: { $cond: ['$isError', 1, 0] } },
          },
        },
        {
          $project: {
            errorRate: {
              $multiply: [{ $divide: ['$errors', '$total'] }, 100],
            },
            total: 1,
          },
        },
      ]),
    ]);

    const currentMonthRequests = monthStats[0]?.totalRequests || 0;
    const lastMonthRequests = lastMonthStats[0]?.totalRequests || 0;
    const growth = lastMonthRequests > 0
      ? ((currentMonthRequests - lastMonthRequests) / lastMonthRequests * 100).toFixed(1)
      : 100;

    res.json({
      status: 'success',
      data: {
        overview: {
          totalApis,
          activeKeys,
          monthlyRequests: currentMonthRequests,
          requestsGrowth: parseFloat(growth),
          avgLatency: Math.round(monthStats[0]?.avgLatency || 0),
          errorCount: monthStats[0]?.errors || 0,
          planLimit: req.user.planLimits.requestsPerMonth,
          planUsagePercent: Math.min(100, Math.round((currentMonthRequests / req.user.planLimits.requestsPerMonth) * 100)),
        },
        recentActivity,
        hourlyTraffic,
        errorRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsageLogs = async (req, res, next) => {
  try {
    const { apiId, apiKeyId, status, page = 1, limit = 50, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (apiId) filter.apiId = apiId;
    if (apiKeyId) filter.apiKeyId = apiKeyId;
    if (status === 'error') filter.isError = true;
    if (status === 'success') filter.isError = false;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      UsageLog.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('apiId', 'name icon')
        .populate('apiKeyId', 'name keyPrefix'),
      UsageLog.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { logs, total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsageStats = async (req, res, next) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [result] = await require('../models/UsageLog').aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' },
        },
      },
    ]);
    const total = result?.totalRequests || 0;
    const errors = result?.errors || 0;
    res.json({
      status: 'success',
      data: {
        totalRequests: total,
        successRate: total > 0 ? ((total - errors) / total) * 100 : 100,
        avgLatency: Math.round(result?.avgLatency || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrafficByApi = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await UsageLog.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            api: '$apiId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          requests: { $sum: 1 },
          errors: { $sum: { $cond: ['$isError', 1, 0] } },
          avgLatency: { $avg: '$latency' },
        },
      },
      {
        $lookup: {
          from: 'apis',
          localField: '_id.api',
          foreignField: '_id',
          as: 'api',
        },
      },
      { $unwind: '$api' },
      { $sort: { '_id.date': 1 } },
    ]);

    res.json({ status: 'success', data: { traffic: data } });
  } catch (error) {
    next(error);
  }
};
