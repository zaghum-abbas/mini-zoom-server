const mongoose = require('mongoose');

const participantSessionSchema = new mongoose.Schema(
  {
    participantId: { type: String, default: '' },
    userName: { type: String, default: '' },
    email: { type: String, default: '' },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { _id: false }
);

const eventLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const meetingAnalyticsSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
    zoomMeetingId: { type: String, index: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    peakParticipants: { type: Number, default: 0 },
    participantSessions: [participantSessionSchema],
    eventLogs: { type: [eventLogSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeetingAnalytics', meetingAnalyticsSchema);
