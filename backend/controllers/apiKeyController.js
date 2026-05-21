const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');
const { AppError } = require('../middleware/errorHandler');
const webhookService = require('../services/webhookService');

exports.createKey = async (req, res, next) => {
  try {
    const { apiId, name, environment, permissions, expiresAt, rateLimit } = req.body;

    const api = await Api.findOne({ _id: apiId, userId: req.user._id });
    if (!api) return next(new AppError('API not found or unauthorized.', 404));

    const apiKey = await ApiKey.create({
      apiId,
      userId: req.user._id,
      name: name || `Key for ${api.name}`,
      environment: environment || 'live',
      permissions,
      expiresAt,
      rateLimit,
    });

    // Show full key only on creation
    const fullKey = apiKey.key;
    apiKey.key = undefined; // Don't store plaintext after this

    webhookService.fire(req.user._id, 'api.key.created', {
      keyId: apiKey._id,
      apiName: api.name,
      environment: apiKey.environment,
    }).catch(() => {});

    res.status(201).json({
      status: 'success',
      message: 'Save this key - it will not be shown again.',
      data: {
        apiKey: {
          ...apiKey.toObject(),
          key: fullKey, // Return full key ONCE
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getKeys = async (req, res, next) => {
  try {
    const { apiId, status } = req.query;
    const filter = { userId: req.user._id };
    if (apiId) filter.apiId = apiId;
    if (status) filter.status = status;

    const keys = await ApiKey.find(filter)
      .populate('apiId', 'name icon color')
      .sort('-createdAt')
      .select('-key -keyHash'); // Never return full keys in list

    res.json({ status: 'success', data: { keys } });
  } catch (error) {
    next(error);
  }
};

exports.revokeKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'revoked' },
      { new: true }
    );
    if (!key) return next(new AppError('API key not found.', 404));

    webhookService.fire(req.user._id, 'api.key.revoked', {
      keyId: key._id,
      keyPrefix: key.keyPrefix,
    }).catch(() => {});

    res.json({ status: 'success', message: 'API key revoked.' });
  } catch (error) {
    next(error);
  }
};

exports.rotateKey = async (req, res, next) => {
  try {
    const oldKey = await ApiKey.findOne({ _id: req.params.id, userId: req.user._id });
    if (!oldKey) return next(new AppError('API key not found.', 404));

    // Create new key with same settings
    const newKey = await ApiKey.create({
      apiId: oldKey.apiId,
      userId: oldKey.userId,
      name: `${oldKey.name} (rotated)`,
      environment: oldKey.environment,
      permissions: oldKey.permissions,
      rateLimit: oldKey.rateLimit,
    });

    const fullNewKey = newKey.key;

    // Mark old key as rotated
    oldKey.status = 'revoked';
    oldKey.rotatedTo = newKey._id;
    await oldKey.save();

    res.json({
      status: 'success',
      message: 'Key rotated. Save the new key - it will not be shown again.',
      data: {
        newKey: {
          ...newKey.toObject(),
          key: fullNewKey,
        },
        revokedKeyId: oldKey._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateKey = async (req, res, next) => {
  try {
    const { name, permissions, rateLimit, expiresAt } = req.body;
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, permissions, rateLimit, expiresAt },
      { new: true, runValidators: true }
    ).select('-key -keyHash');

    if (!key) return next(new AppError('API key not found.', 404));
    res.json({ status: 'success', data: { key } });
  } catch (error) {
    next(error);
  }
};
