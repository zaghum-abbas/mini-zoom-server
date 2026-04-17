const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

const HTTP_MESSAGES = Object.freeze({
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  AUTH_REQUIRED: 'Authentication required',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INVALID_JSON_BODY: 'Invalid JSON body',
  ZOOM_OAUTH_NOT_CONFIGURED: 'Zoom OAuth credentials are not configured',
  ZOOM_WEBHOOK_SECRET_NOT_CONFIGURED: 'Zoom webhook secret is not configured',
  ZOOM_WEBHOOK_MISSING_HEADERS: 'Missing Zoom webhook headers',
  ZOOM_WEBHOOK_INVALID_SIGNATURE: 'Invalid Zoom webhook signature',
  ZOOM_WEBHOOK_STALE_TIMESTAMP: 'Stale Zoom webhook timestamp',
});

module.exports = { HTTP_STATUS, HTTP_MESSAGES };

