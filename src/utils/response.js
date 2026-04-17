const { HTTP_STATUS } = require('../constants/http');

const success = (res, data, message = 'OK', statusCode = HTTP_STATUS.OK) =>
  res.status(statusCode).json({ status: true, data, message });

const error = (res, message = 'Error', statusCode = HTTP_STATUS.BAD_REQUEST, errors) => {
  const payload = { status: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { success, error };

