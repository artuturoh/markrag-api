import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { logger } from './utils/logger.js';

const app = express();

// Security headers with Helmet and Content Security Policy tailored for Tailwind CDN & Google Fonts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Enable CORS
app.use(cors());

// Serve static assets from public directory without automatically hijacking root index
app.use(express.static(path.resolve('public'), { index: false }));

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
