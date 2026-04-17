const { body } = require('express-validator');

const createMeetingValidators = [
  body('topic').isString().trim().notEmpty(),
  body('agenda').optional().isString().trim(),
  body('startTime').optional().isISO8601().toDate(),
  body('durationMinutes').optional().isInt({ min: 1, max: 1440 }),
  body('timezone').optional().isString(),
  body('invitees').optional().isArray(),
  body('invitees.*').optional().isEmail(),
];

module.exports = {
  createMeetingValidators,
};

