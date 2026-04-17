const crypto = require('crypto');
const env = require('../config/env');
const { HTTP_MESSAGES, HTTP_STATUS } = require('../constants/http');
const { error } = require('../utils/response');

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyZoomWebhookSignature = (req, res, next) => {
  const body = req.body || {};
  if (body.event === 'endpoint.url_validation') {
    return next();
  }

  const secret = env.zoomWebhookSecret;
  if (!secret) {
    return error(res, HTTP_MESSAGES.ZOOM_WEBHOOK_SECRET_NOT_CONFIGURED, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const signature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  if (!signature || !timestamp) {
    return error(res, HTTP_MESSAGES.ZOOM_WEBHOOK_MISSING_HEADERS, HTTP_STATUS.UNAUTHORIZED);
  }

  const message = `v0:${timestamp}:${req.rawBody}`;
  const hash = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const expected = `v0=${hash}`;

  if (!timingSafeEqual(signature, expected)) {
    return error(res, HTTP_MESSAGES.ZOOM_WEBHOOK_INVALID_SIGNATURE, HTTP_STATUS.UNAUTHORIZED);
  }

  const ts = Number(timestamp);
  if (Number.isFinite(ts)) {
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(Date.now() - ts * 1000) > fiveMinutes) {
      return error(res, HTTP_MESSAGES.ZOOM_WEBHOOK_STALE_TIMESTAMP, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  return next();
};

module.exports = { verifyZoomWebhookSignature };
