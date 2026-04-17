const { HTTP_MESSAGES, HTTP_STATUS } = require('../constants/http');
const { error } = require('../utils/response');

const notFoundHandler = (req, res) => error(res, HTTP_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || HTTP_MESSAGES.INTERNAL_SERVER_ERROR;
  const errors = err.errors; 

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  return error(res, message, status, errors);
};

module.exports = { notFoundHandler, errorHandler };
