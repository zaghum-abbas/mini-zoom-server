const express = require('express');
const { verifyZoomWebhookSignature } = require('../middlewares/zoomWebhook');
const { zoomWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/', verifyZoomWebhookSignature, zoomWebhook);

module.exports = router;
