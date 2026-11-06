import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`🚀 MarkRAG API running on port ${config.port} in ${config.nodeEnv} mode`);
});

/**
 * Handles graceful shutdown on SIGINT and SIGTERM
 */
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new incoming connections
  server.close((err) => {
    if (err) {
      logger.error('Error during HTTP server shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('HTTP server closed successfully. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if requests do not complete within 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default server;
