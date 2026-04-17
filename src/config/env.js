require('dotenv').config();

const requiredInProduction = [
  'JWT_SECRET',
  'ZOOM_ACCOUNT_ID',
  'ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',
  'ZOOM_WEBHOOK_SECRET_TOKEN',
];

const validateEnv = () => {
  if (process.env.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(`Missing required env: ${missing.join(', ')}`);
    }
  }
};

module.exports = {
  validateEnv,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  zoom: {
    accountId: process.env.ZOOM_ACCOUNT_ID || '',
    clientId: process.env.ZOOM_CLIENT_ID || '',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
    apiBaseUrl: (process.env.ZOOM_API_BASE_URL || 'https://api.zoom.us/v2').replace(/\/+$/, ''),
  },
  zoomWebhookSecret: process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@example.com',
    fromName: process.env.SMTP_FROM_NAME || 'Mini Meeting',
  },
};
