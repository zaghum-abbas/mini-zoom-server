const { Queue } = require('bullmq');
const env = require('../config/env');

const connection = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
};

let emailQueue;
let reminderQueue;

const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = new Queue('email-invites', { connection });
  }
  return emailQueue;
};

const getReminderQueue = () => {
  if (!reminderQueue) {
    reminderQueue = new Queue('meeting-reminders', { connection });
  }
  return reminderQueue;
};

const addEmailInviteJob = async (data) =>
  getEmailQueue().add('send-invites', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  });

const addReminderJob = async (data, delayMs) =>
  getReminderQueue().add('send-reminder', data, {
    delay: Math.max(0, delayMs),
    attempts: 2,
    removeOnComplete: true,
  });

module.exports = {
  connection,
  getEmailQueue,
  getReminderQueue,
  addEmailInviteJob,
  addReminderJob,
};
