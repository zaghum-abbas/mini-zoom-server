const mongoose = require('mongoose');

const MEETING_STATUSES = ['scheduled', 'live', 'ended', 'cancelled'];

const meetingSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true },
    agenda: { type: String, trim: true, default: '' },
    zoomMeetingId: { type: String, required: true, index: true },
    joinUrl: { type: String, required: true },
    startUrl: { type: String, default: '' },
    password: { type: String, default: '' },
    status: { type: String, enum: MEETING_STATUSES, default: 'scheduled', index: true },
    startTime: { type: Date },
    durationMinutes: { type: Number, default: 60 },
    timezone: { type: String, default: 'UTC' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitees: [{ type: String, lowercase: true, trim: true }],
    rawZoomPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
module.exports.MEETING_STATUSES = MEETING_STATUSES;
