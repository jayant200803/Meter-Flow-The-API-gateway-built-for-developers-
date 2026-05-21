const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(apiKeyController.getKeys).post(apiKeyController.createKey);
router.route('/:id').patch(apiKeyController.updateKey);
router.post('/:id/revoke', apiKeyController.revokeKey);
router.post('/:id/rotate', apiKeyController.rotateKey);

module.exports = router;
