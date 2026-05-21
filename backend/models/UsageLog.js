const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: true,
  },
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  endpoint: { type: String, required: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' },
  statusCode: { type: Number, required: true },
  latency: { type: Number, required: true }, // milliseconds
  requestSize: { type: Number, default: 0 }, // bytes
  responseSize: { type: Number, default: 0 }, // bytes
  ip: { type: String },
  userAgent: { type: String },
  country: { type: String },
  isError: { type: Boolean, default: false },
  errorMessage: { type: String },
  billingPeriod: { type: String }, // YYYY-MM format
  isBilled: { type: Boolean, default: false },
  cost: { type: Number, default: 0 }, // in paise/cents
}, {
  timestamps: true,
  timeseries: false,
});

// Compound indexes for fast analytics queries
usageLogSchema.index({ userId: 1, createdAt: -1 });
usageLogSchema.index({ apiKeyId: 1, createdAt: -1 });
usageLogSchema.index({ apiId: 1, createdAt: -1 });
usageLogSchema.index({ billingPeriod: 1, userId: 1 });
usageLogSchema.index({ createdAt: -1 });

// TTL index - auto-delete logs older than 90 days
usageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
