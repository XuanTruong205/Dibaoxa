import http from 'http';
import app from './app.js';
import { connectDB, prisma } from './config/db.js';
import { ENV } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initSocketIO } from './sockets/roomSocket.js';

async function startServer() {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  initSocketIO(server, ENV.CORS_ORIGIN);

  server.listen(ENV.PORT, () => {
    console.log(`Dibaoxa API is running on http://localhost:${ENV.PORT}`);
    console.log('WebSocket server is active.');
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing services...`);
    server.close(async () => {
      await Promise.allSettled([disconnectRedis(), prisma.$disconnect()]);
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error(`Unable to start Dibaoxa API: ${error.message}`);
  process.exit(1);
});
