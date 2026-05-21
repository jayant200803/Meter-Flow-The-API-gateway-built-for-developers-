const axios = require('axios');
const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const { AppError } = require('../middleware/errorHandler');

exports.createApi = async (req, res, next) => {
  try {
    const { name, description, baseUrl, category, icon, color, rateLimit, pricing, tags } = req.body;

    // Check plan limit
    const apiCount = await Api.countDocuments({ userId: req.user._id, status: { $ne: 'deprecated' } });
    if (apiCount >= req.user.planLimits.apisAllowed) {
      return next(new AppError(`Your ${req.user.plan} plan allows max ${req.user.planLimits.apisAllowed} APIs. Upgrade to add more.`, 403));
    }

    const api = await Api.create({
      userId: req.user._id,
      name, description, baseUrl, category, icon, color, rateLimit, pricing, tags,
    });

    res.status(201).json({ status: 'success', data: { api } });
  } catch (error) {
    next(error);
  }
};

exports.getApis = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;
    const [apis, total] = await Promise.all([
      Api.find(filter).populate('activeKeys').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Api.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { apis, total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getApi = async (req, res, next) => {
  try {
    const api = await Api.findOne({ _id: req.params.id, userId: req.user._id }).populate('activeKeys');
    if (!api) return next(new AppError('API not found.', 404));
    res.json({ status: 'success', data: { api } });
  } catch (error) {
    next(error);
  }
};

exports.updateApi = async (req, res, next) => {
  try {
    const api = await Api.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!api) return next(new AppError('API not found.', 404));
    res.json({ status: 'success', data: { api } });
  } catch (error) {
    next(error);
  }
};

exports.deleteApi = async (req, res, next) => {
  try {
    const api = await Api.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'deprecated' },
      { new: true }
    );
    if (!api) return next(new AppError('API not found.', 404));

    // Revoke all keys
    await ApiKey.updateMany({ apiId: req.params.id }, { status: 'revoked' });

    res.json({ status: 'success', message: 'API deprecated and all keys revoked.' });
  } catch (error) {
    next(error);
  }
};

exports.checkApiHealth = async (req, res, next) => {
  try {
    const api = await Api.findOne({ _id: req.params.id, userId: req.user._id });
    if (!api) return next(new AppError('API not found.', 404));
    const start = Date.now();
    try {
      await axios.get(api.baseUrl, { timeout: 6000, validateStatus: () => true });
      res.json({ status: 'success', data: { healthy: true, latency: Date.now() - start, checkedAt: new Date() } });
    } catch (err) {
      res.json({ status: 'success', data: { healthy: false, latency: Date.now() - start, error: err.message, checkedAt: new Date() } });
    }
  } catch (error) {
    next(error);
  }
};

exports.getApiStats = async (req, res, next) => {
  try {
    const api = await Api.findOne({ _id: req.params.id, userId: req.user._id });
    if (!api) return next(new AppError('API not found.', 404));

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stats24h, stats7d, topEndpoints] = await Promise.all([
      UsageLog.aggregate([
        { $match: { apiId: api._id, createdAt: { $gte: last24h } } },
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
        { $match: { apiId: api._id, createdAt: { $gte: last7d } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            requests: { $sum: 1 },
            errors: { $sum: { $cond: ['$isError', 1, 0] } },
            avgLatency: { $avg: '$latency' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UsageLog.aggregate([
        { $match: { apiId: api._id, createdAt: { $gte: last7d } } },
        { $group: { _id: '$endpoint', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      status: 'success',
      data: {
        last24h: stats24h[0] || { totalRequests: 0, errors: 0, avgLatency: 0 },
        dailyStats: stats7d,
        topEndpoints,
      },
    });
  } catch (error) {
    next(error);
  }
};
