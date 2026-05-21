const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'owner', 'consumer'],
    default: 'owner',
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  planLimits: {
    requestsPerMonth: { type: Number, default: 1000 },
    requestsPerMinute: { type: Number, default: 60 },
    apisAllowed: { type: Number, default: 3 },
  },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  avatar: { type: String },
  company: { type: String },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  refreshTokens: [{ type: String }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update plan limits when plan changes
userSchema.pre('save', function (next) {
  if (this.isModified('plan')) {
    const limits = {
      free: { requestsPerMonth: 1000, requestsPerMinute: 60, apisAllowed: 3 },
      pro: { requestsPerMonth: 100000, requestsPerMinute: 600, apisAllowed: 20 },
      enterprise: { requestsPerMonth: 10000000, requestsPerMinute: 6000, apisAllowed: 999 },
    };
    this.planLimits = limits[this.plan];
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    plan: this.plan,
    planLimits: this.planLimits,
    company: this.company,
    avatar: this.avatar,
    isActive: this.isActive,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

module.exports = mongoose.model('User', userSchema);
