const Meeting = require('../models/Meeting');
const MeetingAnalytics = require('../models/MeetingAnalytics');
const zoomService = require('./zoomService');
const { addEmailInviteJob, addReminderJob } = require('../jobs/queues');
const { HTTP_STATUS } = require('../constants/http');
const { MESSAGES } = require('../constants/messages');

const createMeetingForUser = async (actorUser, input) => {
  console.log("input",input);
  const zoomPayload = await zoomService.createMeeting({
    topic: input.topic,
    agenda: input.agenda,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes || 60,
    timezone: input.timezone || 'UTC',
    type: input.startTime ? 2 : 1,
  });

  console.log("zoomPayload",zoomPayload);

  const meeting = await Meeting.create({
    topic: input.topic,
    agenda: input.agenda || '',
    zoomMeetingId: String(zoomPayload.id),
    joinUrl: zoomPayload.join_url,
    startUrl: zoomPayload.start_url || '',
    password: zoomPayload.password || '',
    status: 'scheduled',
    startTime: zoomPayload.start_time ? new Date(zoomPayload.start_time) : new Date(),
    durationMinutes: zoomPayload.duration || input.durationMinutes || 60,
    timezone: zoomPayload.timezone || input.timezone || 'UTC',
    createdBy: actorUser._id,
    invitees: input.invitees || [],
    rawZoomPayload: zoomPayload,
  });

  await MeetingAnalytics.create({
    meeting: meeting._id,
    zoomMeetingId: meeting.zoomMeetingId,
    eventLogs: [{ type: 'meeting.created', payload: { by: actorUser._id.toString() } }],
  });

  if (meeting.invitees?.length) {
    await addEmailInviteJob({
      meetingId: meeting._id.toString(),
      topic: meeting.topic,
      joinUrl: meeting.joinUrl,
      invitees: meeting.invitees,
    });
  }

  if (meeting.startTime) {
    const reminderAt = new Date(meeting.startTime.getTime() - 15 * 60 * 1000);
    if (reminderAt > new Date()) {
      await addReminderJob(
        { meetingId: meeting._id.toString(), topic: meeting.topic, joinUrl: meeting.joinUrl },
        reminderAt.getTime() - Date.now()
      );
    }
  }

  return meeting;
};

const listMeetingsForUser = async (user) => {
  const userEmail = (user.email || '').toLowerCase().trim();
  const filter =
    user.role === 'admin'
      ? {}
      : {
          $or: [{ createdBy: user._id }, { invitees: userEmail }],
        };
  return Meeting.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'email name');
};

const getMeetingById = async (id, user) => {
  const meeting = await Meeting.findById(id).populate('createdBy', 'email name');
  if (!meeting) {
    const err = new Error(MESSAGES.MEETING_NOT_FOUND);
    err.status = HTTP_STATUS.NOT_FOUND;
    throw err;
  }
  const userEmail = (user.email || '').toLowerCase().trim();
  const isCreator = meeting.createdBy?._id?.toString() === user._id.toString();
  const isInvitee = Boolean(userEmail) && (meeting.invitees || []).includes(userEmail);
  if (user.role !== 'admin' && !isCreator && !isInvitee) {
    const err = new Error(MESSAGES.FORBIDDEN);
    err.status = HTTP_STATUS.FORBIDDEN;
    throw err;
  }
  return meeting;
};

const deleteMeetingById = async (id, user) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    const err = new Error(MESSAGES.MEETING_NOT_FOUND);
    err.status = HTTP_STATUS.NOT_FOUND;
    throw err;
  }

  const isCreator = meeting.createdBy?.toString() === user._id.toString();
  if (user.role !== 'admin' && !isCreator) {
    const err = new Error(MESSAGES.FORBIDDEN);
    err.status = HTTP_STATUS.FORBIDDEN;
    throw err;
  }

  await MeetingAnalytics.deleteMany({ meeting: meeting._id });
  await Meeting.deleteOne({ _id: meeting._id });

  return meeting;
};

const updateMeetingById = async (id, user, input) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    const err = new Error(MESSAGES.MEETING_NOT_FOUND);
    err.status = HTTP_STATUS.NOT_FOUND;
    throw err;
  }

  const isCreator = meeting.createdBy?.toString() === user._id.toString();
  if (user.role !== 'admin' && !isCreator) {
    const err = new Error(MESSAGES.FORBIDDEN);
    err.status = HTTP_STATUS.FORBIDDEN;
    throw err;
  }

  const patch = {
    topic: input.topic,
    agenda: input.agenda ?? '',
    durationMinutes: input.durationMinutes ?? meeting.durationMinutes,
    timezone: input.timezone ?? meeting.timezone,
  };
  if (input.startTime) patch.startTime = input.startTime;

  await zoomService.updateMeeting(meeting.zoomMeetingId, patch);

  meeting.topic = patch.topic;
  meeting.agenda = patch.agenda;
  meeting.durationMinutes = patch.durationMinutes;
  meeting.timezone = patch.timezone;
  if (patch.startTime) meeting.startTime = new Date(patch.startTime);
  if (Array.isArray(input.invitees)) meeting.invitees = input.invitees;

  await meeting.save();
  return meeting;
};

module.exports = {
  createMeetingForUser,
  listMeetingsForUser,
  getMeetingById,
  deleteMeetingById,
  updateMeetingById,
};
