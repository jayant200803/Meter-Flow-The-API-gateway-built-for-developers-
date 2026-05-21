const axios = require('axios');
const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const { incrementKey } = require('../config/redis');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');
const webhookService = require('../services/webhookService');

const getCurrentBillingPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const gatewayMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  let apiKeyDoc = null;

  try {
    // 1. Extract API key from header or query param
    const rawKey = req.headers['x-api-key'] || req.query.api_key;
    if (!rawKey) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'API key required. Pass it via X-API-Key header or api_key query param.',
        docs: 'https://meterflow.dev/docs/authentication',
      });
    }

    // 2. Validate key
    apiKeyDoc = await ApiKey.findByKey(rawKey);
    if (!apiKeyDoc) {
      return res.status(401).json({
        error: 'invalid_key',
        message: 'Invalid or revoked API key.',
      });
    }

    // 3. Check key expiry
    if (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt) {
      return res.status(401).json({
        error: 'key_expired',
        message: 'API key has expired.',
      });
    }

    const api = apiKeyDoc.apiId;
    const user = apiKeyDoc.userId;

    // 4. Rate limiting (per API key, per minute)
    const rateLimitKey = `ratelimit:key:${apiKeyDoc._id}:${Math.floor(Date.now() / 60000)}`;
    const rpmLimit = apiKeyDoc.rateLimit?.requestsPerMinute || api.rateLimit?.requestsPerMinute || 60;
    const currentCount = await incrementKey(rateLimitKey, 60);

    if (currentCount > rpmLimit) {
      // Fire webhook
      webhookService.fire(user._id, 'rate.limit.exceeded', {
        apiKeyId: apiKeyDoc._id,
        apiName: api.name,
        limit: rpmLimit,
      }).catch(() => {});

      res.setHeader('X-RateLimit-Limit', rpmLimit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 60000) * 60);
      res.setHeader('Retry-After', 60);

      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Max ${rpmLimit} requests/minute.`,
        retryAfter: 60,
      });
    }

    // 5. Monthly usage limit check
    const monthlyKey = `usage:monthly:${apiKeyDoc.userId._id || apiKeyDoc.userId}:${getCurrentBillingPeriod()}`;
    const monthlyUsage = await incrementKey(monthlyKey, 86400 * 32);
    const monthlyLimit = user.planLimits?.requestsPerMonth || 1000;

    if (monthlyUsage > monthlyLimit) {
      webhookService.fire(user._id, 'usage.limit.exceeded', {
        usage: monthlyUsage,
        limit: monthlyLimit,
        period: getCurrentBillingPeriod(),
      }).catch(() => {});

      return res.status(429).json({
        error: 'monthly_limit_exceeded',
        message: `Monthly request limit of ${monthlyLimit} exceeded. Upgrade your plan.`,
        usage: monthlyUsage,
        limit: monthlyLimit,
      });
    }

    // Fire 80% warning webhook
    if (monthlyUsage === Math.floor(monthlyLimit * 0.8)) {
      webhookService.fire(user._id, 'usage.limit.warning', {
        usage: monthlyUsage,
        limit: monthlyLimit,
        percentage: 80,
      }).catch(() => {});
    }

    // 6. Build target URL
    const targetPath = req.params[0] || '';
    const queryString = new URLSearchParams(req.query).toString();
    let targetUrl = `${api.baseUrl}/${targetPath}`;
    if (queryString) targetUrl += `?${queryString}`;

    // Remove api_key from forwarded query
    const cleanQuery = { ...req.query };
    delete cleanQuery.api_key;

    // 7. Forward request to actual API
    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: cleanQuery,
      data: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'User-Agent': 'MeterFlow-Gateway/1.0',
        'X-Forwarded-For': req.ip,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true, // Don't throw on non-2xx
    });

    const latency = Date.now() - startTime;
    const isError = response.status >= 400;

    // 8. Log usage (async, don't block response)
    const billingPeriod = getCurrentBillingPeriod();
    const usageLog = new UsageLog({
      apiKeyId: apiKeyDoc._id,
      apiId: api._id,
      userId: apiKeyDoc.userId._id || apiKeyDoc.userId,
      endpoint: `/${targetPath}`,
      method: req.method,
      statusCode: response.status,
      latency,
      requestSize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0,
      responseSize: JSON.stringify(response.data).length,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      isError,
      billingPeriod,
    });
    usageLog.save().catch(err => logger.error('Usage log save error:', err));

    // Update key last used (async)
    ApiKey.findByIdAndUpdate(apiKeyDoc._id, {
      lastUsedAt: new Date(),
      $inc: { totalRequests: 1 },
    }).catch(() => {});

    // Emit realtime update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${apiKeyDoc.userId._id || apiKeyDoc.userId}`).emit('request-logged', {
        apiName: api.name,
        endpoint: `/${targetPath}`,
        statusCode: response.status,
        latency,
        timestamp: new Date(),
      });
    }

    // 9. Add MeterFlow headers and forward response
    res.setHeader('X-RateLimit-Limit', rpmLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, rpmLimit - currentCount));
    res.setHeader('X-MeterFlow-Latency', latency);
    res.setHeader('X-MeterFlow-RequestId', usageLog._id);

    return res.status(response.status).json(response.data);

  } catch (error) {
    const latency = Date.now() - startTime;

    // Log failed request
    if (apiKeyDoc) {
      const usageLog = new UsageLog({
        apiKeyId: apiKeyDoc._id,
        apiId: apiKeyDoc.apiId._id || apiKeyDoc.apiId,
        userId: apiKeyDoc.userId._id || apiKeyDoc.userId,
        endpoint: req.path,
        method: req.method,
        statusCode: 502,
        latency,
        ip: req.ip,
        isError: true,
        errorMessage: error.message,
        billingPeriod: getCurrentBillingPeriod(),
      });
      usageLog.save().catch(() => {});
    }

    logger.error('Gateway error:', error.message);
    return res.status(502).json({
      error: 'gateway_error',
      message: 'Failed to reach upstream API. Please try again.',
    });
  }
};

module.exports = { gatewayMiddleware };
