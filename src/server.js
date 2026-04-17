const http = require('http');
const { createApp } = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { initSocket } = require('./sockets');
const { startWorkers } = require('./jobs/workers');
const { connection } = require('./jobs/queues');

const main = async () => {
  env.validateEnv();

  await connectDatabase(env.mongoUri);

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  const stopWorkers = startWorkers(connection);

  server.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });

  const shutdown = async () => {
    console.info('Shutting down...');
    stopWorkers();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
