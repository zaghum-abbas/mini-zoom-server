const { HTTP_MESSAGES, HTTP_STATUS } = require('../constants/http');
const { error } = require('../utils/response');

const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return error(res, HTTP_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, HTTP_MESSAGES.INSUFFICIENT_PERMISSIONS, HTTP_STATUS.FORBIDDEN);
    }
    return next();
  };

module.exports = { requireRole };
