const { Worker } = require('bullmq');
const emailService = require('../services/emailService');

const createEmailWorker = (connection) =>
  new Worker(
    'email-invites',
    async (job) => {
      const { invitees, topic, joinUrl, meetingId } = job.data;
      const subject = `Meeting invitation: ${topic}`;
      for (const to of invitees || []) {
        const text = `You are invited to "${topic}".\n\nJoin: ${joinUrl}\n\nMeeting ID in app: ${meetingId}`;
        await emailService.sendMail({ to, subject, text });
      }
    },
    { connection }
  );

module.exports = { createEmailWorker };
