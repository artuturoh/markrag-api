import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { logger } from './utils/logger.js';

const app = express();

// Security headers with Helmet
app.use(helmet());

// Enable CORS
app.use(cors());

// Body parsing with safe size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Mount API routes
app.use(routes);

// 404 handler for unknown paths
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
