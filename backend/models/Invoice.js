const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  invoiceNumber: { type: String, unique: true },
  billingPeriod: { type: String, required: true }, // YYYY-MM
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  lineItems: [{
    apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api' },
    apiName: String,
    totalRequests: Number,
    billableRequests: Number,
    freeTierRequests: Number,
    pricePerRequest: Number,
    amount: Number, // in paise/cents
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
    default: 'draft',
    index: true,
  },
  stripeInvoiceId: { type: String },
  stripePaymentIntentId: { type: String },
  paidAt: { type: Date },
  dueDate: { type: Date },
  notes: { type: String },
}, {
  timestamps: true,
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `MF-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
