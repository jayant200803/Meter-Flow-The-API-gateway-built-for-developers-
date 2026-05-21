const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(apiController.getApis).post(apiController.createApi);
router.route('/:id').get(apiController.getApi).patch(apiController.updateApi).delete(apiController.deleteApi);
router.get('/:id/stats', apiController.getApiStats);
router.get('/:id/health', apiController.checkApiHealth);

module.exports = router;
