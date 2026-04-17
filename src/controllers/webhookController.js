const crypto = require('crypto');
const env = require('../config/env');
const { handleMeetingStarted, handleMeetingEnded } = require('../webhooks/meetingHandlers');
const { handleParticipantJoined, handleParticipantLeft } = require('../webhooks/participantHandlers');
const { HTTP_STATUS } = require('../constants/http');
const { error, success } = require('../utils/response');
const { MESSAGES } = require('../constants/messages');

const encryptUrlValidationToken = (plainToken) =>
  crypto.createHmac('sha256', env.zoomWebhookSecret).update(plainToken).digest('hex');

const zoomWebhook = async (req, res) => {
  const body = req.body || {};

  if (body.event === 'endpoint.url_validation') {
    const plainToken = body.payload?.plainToken;
    if (!plainToken) {
      return error(res, MESSAGES.WEBHOOK_MISSING_PLAIN_TOKEN, HTTP_STATUS.BAD_REQUEST);
    }
    const encryptedToken = encryptUrlValidationToken(plainToken);
    return success(res, { plainToken, encryptedToken }, MESSAGES.WEBHOOK_URL_VALIDATION_OK, HTTP_STATUS.OK);
  }

  try {
    switch (body.event) {
      case 'meeting.started':
        await handleMeetingStarted(body.payload || {});
        break;
      case 'meeting.ended':
        await handleMeetingEnded(body.payload || {});
        break;
      case 'meeting.participant_joined':
        await handleParticipantJoined(body.payload || {});
        break;
      case 'meeting.participant_left':
        await handleParticipantLeft(body.payload || {});
        break;
      default:
        break;
    }
  } catch (err) {
    console.log('[webhook]', body.event, err);
    return error(res, MESSAGES.WEBHOOK_HANDLER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return success(res, { received: true }, MESSAGES.WEBHOOK_RECEIVED, HTTP_STATUS.OK);
};

module.exports = { zoomWebhook };
