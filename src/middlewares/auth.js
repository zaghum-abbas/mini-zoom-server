const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { HTTP_MESSAGES, HTTP_STATUS } = require('../constants/http');
const { error } = require('../utils/response');

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
};

const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return error(res, HTTP_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return error(res, HTTP_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
    }
    req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    req.authUser = user;
    return next();
  } catch (err) {
    return error(res, HTTP_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }
};

module.exports = { authenticate, extractToken };
