const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'refresh_fallback',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, company } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already registered. Please log in.', 400));
    }

    const user = await User.create({ name, email, password, company });
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshTokens = [refreshToken];
    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: user.toPublicJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required.', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account deactivated. Contact support.', 401));
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Rotate refresh tokens (keep max 5)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);

    res.json({
      status: 'success',
      data: {
        user: user.toPublicJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token required.', 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_fallback');
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(new AppError('Invalid refresh token.', 401));
    }

    const tokens = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    res.json({ status: 'success', data: tokens });
  } catch (error) {
    next(new AppError('Invalid or expired refresh token.', 401));
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      req.user.refreshTokens = req.user.refreshTokens.filter(t => t !== refreshToken);
      await req.user.save({ validateBeforeSave: false });
    }
    res.json({ status: 'success', message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  res.json({ status: 'success', data: { user: req.user.toPublicJSON() } });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, company, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, company, avatar },
      { new: true, runValidators: true }
    );
    res.json({ status: 'success', data: { user: user.toPublicJSON() } });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    res.json({ status: 'success', message: 'Password changed. Please log in again.' });
  } catch (error) {
    next(error);
  }
};
