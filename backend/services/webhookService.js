const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const logger = require('../utils/logger');

exports.fire = async (userId, event, payload) => {
  try {
    const webhooks = await Webhook.find({
      userId,
      isActive: true,
      events: event,
      failureCount: { $lt: 10 },
    });

    if (webhooks.length === 0) return;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    for (const webhook of webhooks) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');

      try {
        await axios.post(webhook.url, body, {
          headers: {
            'Content-Type': 'application/json',
            'X-MeterFlow-Signature': `sha256=${signature}`,
            'X-MeterFlow-Event': event,
            'X-MeterFlow-Delivery': crypto.randomUUID(),
          },
          timeout: 5000,
        });

        await Webhook.findByIdAndUpdate(webhook._id, {
          lastDeliveredAt: new Date(),
          $set: { failureCount: 0 },
        });

        logger.info(`Webhook delivered: ${event} → ${webhook.url}`);
      } catch (err) {
        await Webhook.findByIdAndUpdate(webhook._id, {
          lastFailedAt: new Date(),
          lastError: err.message,
          $inc: { failureCount: 1 },
        });
        logger.warn(`Webhook failed: ${event} → ${webhook.url}: ${err.message}`);
      }
    }
  } catch (error) {
    logger.error(`Webhook service error: ${error.message}`);
  }
};

exports.createWebhook = async (userId, url, events) => {
  return Webhook.create({ userId, url, events });
};

exports.getWebhooks = async (userId) => {
  return Webhook.find({ userId }).select('-secret');
};

exports.deleteWebhook = async (id, userId) => {
  return Webhook.findOneAndDelete({ _id: id, userId });
};
