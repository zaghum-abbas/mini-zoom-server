const { createEmailWorker } = require('./emailWorker');
const { createReminderWorker } = require('./reminderWorker');

const startWorkers = (connection) => {
  const emailWorker = createEmailWorker(connection);
  const reminderWorker = createReminderWorker(connection);

  const onFailed = (name) => (job, err) => {
    console.error(`[${name}] job failed`, job?.id, err?.message);
  };

  emailWorker.on('failed', onFailed('email'));
  reminderWorker.on('failed', onFailed('reminder'));

  return async () => {
    await emailWorker.close();
    await reminderWorker.close();
  };
};

module.exports = { startWorkers };
