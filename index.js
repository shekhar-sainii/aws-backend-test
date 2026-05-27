const app = require('./app');
const config = require('./config/environment');

// Start Server
const server = app.listen(config.PORT, () => {
  console.log(`=========================================`);
  console.log(`  ${config.APP_NAME} running!`);
  console.log(`  Local Address: http://localhost:${config.PORT}`);
  console.log(`  Environment:   ${config.NODE_ENV}`);
  console.log(`  Process ID:    ${process.pid}`);
  console.log(`=========================================`);
});

// Graceful Shutdown (Best practice for AWS deployments, e.g., ECS, App Runner)
const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if connections do not close in 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
