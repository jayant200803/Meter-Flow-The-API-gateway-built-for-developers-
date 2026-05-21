const mongoose = require('mongoose');
const crypto = require('crypto');

const webhookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  url: { type: String, required: true },
  secret: { type: String },
  events: [{
    type: String,
    enum: [
      'usage.limit.warning',   // 80% of limit reached
      'usage.limit.exceeded',  // 100% reached
      'billing.invoice.created',
      'billing.invoice.paid',
      'api.key.created',
      'api.key.revoked',
      'rate.limit.exceeded',
    ],
  }],
  isActive: { type: Boolean, default: true },
  failureCount: { type: Number, default: 0 },
  lastDeliveredAt: { type: Date },
  lastFailedAt: { type: Date },
  lastError: { type: String },
}, {
  timestamps: true,
});

webhookSchema.pre('save', function (next) {
  if (!this.secret) {
    this.secret = 'whsec_' + crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Webhook', webhookSchema);
