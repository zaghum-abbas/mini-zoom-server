const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { HTTP_STATUS } = require('../constants/http');
const { MESSAGES } = require('../constants/messages');
const { error, success } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors.array());
    }
    const { email, password, name } = req.body;
    const result = await authService.registerUser({ email, password, name, role: 'user' });
    return success(res, result, MESSAGES.REGISTERED, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors.array());
    }
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return success(res, result, MESSAGES.LOGGED_IN, HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

const me = async (req, res) => success(res, { user: req.user }, MESSAGES.USER_FETCHED, HTTP_STATUS.OK);

module.exports = { register, login, me };
