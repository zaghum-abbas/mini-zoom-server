const { Worker } = require('bullmq');
const emailService = require('../services/emailService');
const User = require('../models/User');
const Meeting = require('../models/Meeting');

const createReminderWorker = (connection) =>
  new Worker(
    'meeting-reminders',
    async (job) => {
      const { meetingId, topic, joinUrl } = job.data;
      const meeting = await Meeting.findById(meetingId).populate('createdBy');
      if (!meeting || meeting.status === 'ended' || meeting.status === 'cancelled') {
        return;
      }
      const creator = meeting.createdBy;
      const recipients = new Set();
      if (creator?.email) recipients.add(creator.email);
      (meeting.invitees || []).forEach((e) => recipients.add(e));

      const subject = `Reminder: ${topic} starts soon`;
      const text = `Your meeting "${topic}" is scheduled to begin in about 15 minutes.\n\nJoin: ${joinUrl}`;

      for (const to of recipients) {
        await emailService.sendMail({ to, subject, text });
      }

      const admins = await User.find({ role: 'admin' }).select('email');
      for (const a of admins) {
        if (!recipients.has(a.email)) {
          await emailService.sendMail({
            to: a.email,
            subject: `[Admin] ${subject}`,
            text,
          });
        }
      }
    },
    { connection }
  );

module.exports = { createReminderWorker };
