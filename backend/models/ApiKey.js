const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Default Key',
  },
  key: {
    type: String,
    unique: true,
    index: true,
  },
  keyPrefix: { type: String }, // First 8 chars for display (e.g., "mf_live_")
  keyHash: { type: String },   // SHA-256 hash for secure comparison
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'rotating'],
    default: 'active',
    index: true,
  },
  environment: {
    type: String,
    enum: ['live', 'test'],
    default: 'live',
  },
  permissions: {
    read: { type: Boolean, default: true },
    write: { type: Boolean, default: false },
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: null }, // null = use API default
    requestsPerDay: { type: Number, default: null },
  },
  allowedIPs: [String],
  expiresAt: { type: Date, default: null },
  lastUsedAt: { type: Date },
  totalRequests: { type: Number, default: 0 },
  monthlyRequests: { type: Number, default: 0 },
  rotatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' },
  metadata: { type: Map, of: String },
}, {
  timestamps: true,
});

// Generate API key before saving
apiKeySchema.pre('save', function (next) {
  if (!this.key) {
    const env = this.environment === 'test' ? 'test' : 'live';
    const rawKey = `mf_${env}_${crypto.randomBytes(24).toString('hex')}`;
    this.key = rawKey;
    this.keyPrefix = rawKey.substring(0, 12) + '...';
    this.keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  }
  next();
});

// Static method to find by key (with hash comparison)
apiKeySchema.statics.findByKey = async function (rawKey) {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return this.findOne({ keyHash, status: 'active' })
    .populate('apiId')
    .populate('userId', 'name email plan planLimits');
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
