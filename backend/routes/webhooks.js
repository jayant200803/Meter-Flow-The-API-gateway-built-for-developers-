const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhookService');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.use('/user', protect);

router.get('/user', async (req, res, next) => {
  try {
    const webhooks = await webhookService.getWebhooks(req.user._id);
    res.json({ status: 'success', data: { webhooks } });
  } catch (e) { next(e); }
});

router.post('/user', async (req, res, next) => {
  try {
    const { url, events } = req.body;
    const webhook = await webhookService.createWebhook(req.user._id, url, events);
    res.status(201).json({ status: 'success', data: { webhook } });
  } catch (e) { next(e); }
});

router.delete('/user/:id', async (req, res, next) => {
  try {
    await webhookService.deleteWebhook(req.params.id, req.user._id);
    res.json({ status: 'success', message: 'Webhook deleted.' });
  } catch (e) { next(e); }
});

module.exports = router;
