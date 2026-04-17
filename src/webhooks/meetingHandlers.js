const analyticsService = require('../services/analyticsService');
const { emitMeetingEvent } = require('../sockets');

const handleMeetingStarted = async (payload) => {
  const object = payload.object || {};
  const zoomMeetingId = String(object.id || object.uuid || '');
  if (!zoomMeetingId) return { ok: false };

  const result = await analyticsService.markMeetingStarted(zoomMeetingId);
  if (result?.meeting) {
    emitMeetingEvent(result.meeting._id.toString(), 'meeting:status', {
      status: 'live',
      zoomMeetingId,
    });
  }
  return { ok: true, result };
};

const handleMeetingEnded = async (payload) => {
  const object = payload.object || {};
  const zoomMeetingId = String(object.id || object.uuid || '');
  if (!zoomMeetingId) return { ok: false };

  const result = await analyticsService.markMeetingEnded(zoomMeetingId);
  if (result?.meeting) {
    emitMeetingEvent(result.meeting._id.toString(), 'meeting:status', {
      status: 'ended',
      zoomMeetingId,
    });
  }
  return { ok: true, result };
};

module.exports = { handleMeetingStarted, handleMeetingEnded };
