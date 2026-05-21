const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'API name is required'],
    trim: true,
    maxlength: [100, 'API name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  baseUrl: {
    type: String,
    required: [true, 'Base URL is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['ecommerce', 'weather', 'finance', 'social', 'gaming', 'custom', 'other'],
    default: 'other',
  },
  icon: { type: String, default: '🔌' },
  color: { type: String, default: '#6366f1' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active',
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerDay: { type: Number, default: 10000 },
    requestsPerMonth: { type: Number, default: 100000 },
  },
  pricing: {
    model: {
      type: String,
      enum: ['free', 'per_request', 'tiered'],
      default: 'per_request',
    },
    pricePerRequest: { type: Number, default: 0 }, // in paise/cents
    freeTierRequests: { type: Number, default: 1000 },
    tiers: [{
      upTo: Number,
      pricePerRequest: Number,
    }],
  },
  allowedOrigins: [String],
  tags: [String],
  totalRequests: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
  avgLatency: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Virtual: active keys count
apiSchema.virtual('activeKeys', {
  ref: 'ApiKey',
  localField: '_id',
  foreignField: 'apiId',
  count: true,
  match: { status: 'active' },
});

module.exports = mongoose.model('Api', apiSchema);
