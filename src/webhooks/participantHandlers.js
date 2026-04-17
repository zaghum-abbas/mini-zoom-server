const analyticsService = require('../services/analyticsService');
const { emitMeetingEvent } = require('../sockets');

const handleParticipantJoined = async (payload) => {
  const object = payload.object || {};
  const zoomMeetingId = String(object.id || object.uuid || '');
  const participant = object.participant || object;

  const result = await analyticsService.recordParticipantJoined(zoomMeetingId, {
    object: participant,
    raw: payload,
  });

  if (result?.meeting) {
    emitMeetingEvent(result.meeting._id.toString(), 'participant:joined', {
      userName: participant.user_name || participant.userName,
      participantId: participant.user_id || participant.participant_user_id,
      at: new Date().toISOString(),
    });
  }
  return { ok: true };
};

const handleParticipantLeft = async (payload) => {
  const object = payload.object || {};
  const zoomMeetingId = String(object.id || object.uuid || '');
  const participant = object.participant || object;

  const result = await analyticsService.recordParticipantLeft(zoomMeetingId, {
    object: participant,
    raw: payload,
  });

  if (result?.meeting) {
    emitMeetingEvent(result.meeting._id.toString(), 'participant:left', {
      userName: participant.user_name || participant.userName,
      participantId: participant.user_id || participant.participant_user_id,
      at: new Date().toISOString(),
    });
  }
  return { ok: true };
};

module.exports = { handleParticipantJoined, handleParticipantLeft };
