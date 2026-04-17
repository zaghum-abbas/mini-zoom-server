const Meeting = require('../models/Meeting');
const MeetingAnalytics = require('../models/MeetingAnalytics');
const { HTTP_STATUS } = require('../constants/http');
const { MESSAGES } = require('../constants/messages');

const findMeetingByZoomRef = async (zoomMeetingId) => {
  if (!zoomMeetingId) return null;
  const id = String(zoomMeetingId);
  return Meeting.findOne({
    $or: [{ zoomMeetingId: id }, { 'rawZoomPayload.uuid': id }],
  });
};

const getOrCreateAnalytics = async (meetingId, zoomMeetingId) => {
  let doc = await MeetingAnalytics.findOne({ meeting: meetingId });
  if (!doc) {
    doc = await MeetingAnalytics.create({ meeting: meetingId, zoomMeetingId });
  }
  return doc;
};

const appendEvent = async (zoomMeetingId, type, payload) => {
  const meeting = await findMeetingByZoomRef(zoomMeetingId);
  if (!meeting) return null;

  const analytics = await getOrCreateAnalytics(meeting._id, zoomMeetingId);
  analytics.eventLogs.push({ type, payload, at: new Date() });
  await analytics.save();
  return { meeting, analytics };
};

const markMeetingStarted = async (zoomMeetingId) => {
  const meeting = await findMeetingByZoomRef(zoomMeetingId);
  if (!meeting) return null;
  meeting.status = 'live';
  await meeting.save();

  const analytics = await getOrCreateAnalytics(meeting._id, zoomMeetingId);
  if (!analytics.startedAt) {
    analytics.startedAt = new Date();
  }
  analytics.eventLogs.push({ type: 'meeting.started', payload: { zoomMeetingId } });
  await analytics.save();
  return { meeting, analytics };
};

const markMeetingEnded = async (zoomMeetingId) => {
  const meeting = await findMeetingByZoomRef(zoomMeetingId);
  if (!meeting) return null;
  meeting.status = 'ended';
  await meeting.save();

  const analytics = await getOrCreateAnalytics(meeting._id, zoomMeetingId);
  analytics.endedAt = new Date();
  if (analytics.startedAt) {
    analytics.durationSeconds = Math.floor((analytics.endedAt - analytics.startedAt) / 1000);
  }
  analytics.eventLogs.push({ type: 'meeting.ended', payload: { zoomMeetingId } });
  await analytics.save();
  return { meeting, analytics };
};

const upsertParticipantSession = (analytics, participant) => {
  const pid = participant.participant_user_id || participant.user_id || participant.id || participant.userId;
  const userName = participant.user_name || participant.userName || '';
  const email = participant.email || '';

  const openIdx = analytics.participantSessions.findIndex(
    (s) => s.participantId === String(pid) && !s.leftAt
  );

  if (openIdx >= 0) {
    return { index: openIdx, session: analytics.participantSessions[openIdx] };
  }

  analytics.participantSessions.push({
    participantId: String(pid || `${userName}-${Date.now()}`),
    userName,
    email,
    joinedAt: new Date(),
  });
  return { index: analytics.participantSessions.length - 1, session: analytics.participantSessions.at(-1) };
};

const recordParticipantJoined = async (zoomMeetingId, participantPayload) => {
  const result = await appendEvent(zoomMeetingId, 'participant.joined', participantPayload);
  if (!result) return null;

  const { meeting, analytics } = result;
  upsertParticipantSession(analytics, participantPayload.object || participantPayload);
  const active = analytics.participantSessions.filter((s) => s.joinedAt && !s.leftAt).length;
  analytics.peakParticipants = Math.max(analytics.peakParticipants || 0, active);
  await analytics.save();
  return { meeting, analytics };
};

const recordParticipantLeft = async (zoomMeetingId, participantPayload) => {
  const result = await appendEvent(zoomMeetingId, 'participant.left', participantPayload);
  if (!result) return null;

  const { meeting, analytics } = result;
  const p = participantPayload.object || participantPayload;
  const pid = String(p.participant_user_id || p.user_id || p.id || p.userId || '');

  const openIdx = analytics.participantSessions.findIndex((s) => s.participantId === pid && !s.leftAt);
  if (openIdx >= 0) {
    analytics.participantSessions[openIdx].leftAt = new Date();
  }
  await analytics.save();
  return { meeting, analytics };
};

const getAnalyticsForMeeting = async (meetingId) => {
  const analytics = await MeetingAnalytics.findOne({ meeting: meetingId });
  if (!analytics) {
    const err = new Error(MESSAGES.ANALYTICS_NOT_FOUND);
    err.status = HTTP_STATUS.NOT_FOUND;
    throw err;
  }
  return analytics;
};

module.exports = {
  appendEvent,
  markMeetingStarted,
  markMeetingEnded,
  recordParticipantJoined,
  recordParticipantLeft,
  getAnalyticsForMeeting,
};
