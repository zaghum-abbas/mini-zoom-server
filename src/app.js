const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
const webhookRoutes = require('./routes/webhook.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { HTTP_MESSAGES, HTTP_STATUS } = require('./constants/http');
const { MESSAGES } = require('./constants/messages');
const { error, success } = require('./utils/response');

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  const webhookParser = express.raw({ type: 'application/json' });
  app.use('/api/webhooks/zoom', webhookParser, (req, res, next) => {
    req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    try {
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch {
      return error(res, HTTP_MESSAGES.INVALID_JSON_BODY, HTTP_STATUS.BAD_REQUEST);
    }
    return webhookRoutes(req, res, next);
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    return success(res, { ok: true }, MESSAGES.API_HEALTH_OK, HTTP_STATUS.OK);
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
