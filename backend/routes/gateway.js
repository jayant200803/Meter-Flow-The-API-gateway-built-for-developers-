const express = require('express');
const router = express.Router();
const { gatewayMiddleware } = require('../middleware/gateway');

// All requests to /gateway/:anything pass through the gateway
router.all('/*', gatewayMiddleware);

module.exports = router;
