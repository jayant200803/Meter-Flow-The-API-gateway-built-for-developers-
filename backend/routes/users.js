const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.use(protect);

// Admin only: get all users
router.get('/', restrictTo('admin'), async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password -refreshTokens');
    res.json({ status: 'success', data: { users } });
  } catch (e) { next(e); }
});

// Update own settings
router.patch('/settings', async (req, res, next) => {
  try {
    const allowed = ['name', 'company', 'avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ status: 'success', data: { user: user.toPublicJSON() } });
  } catch (e) { next(e); }
});

module.exports = router;
