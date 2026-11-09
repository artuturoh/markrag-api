import crypto from 'crypto';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// In-memory rate-limiter store for /v1/demo (15 req/minute per IP)
const demoRateLimitStore = new Map();

/**
 * In-memory Rate Limiter for /v1/demo (15 requests per minute per IP)
 */
export function demoRateLimiter(req, res, next) {
  const ip =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  let record = demoRateLimitStore.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    demoRateLimitStore.set(ip, record);
    return next();
  }

  record.count++;
  if (record.count > maxRequests) {
    logger.warn(`Demo rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demo rate limit exceeded (max 5 requests per minute). Please subscribe on RapidAPI for unlimited access.',
        details: null,
      },
    });
  }

  return next();
}

/**
 * Resets the demo rate limiter store (useful for tests)
 */
export function resetDemoRateLimiter() {
  demoRateLimitStore.clear();
}

/**
 * Security Middleware to validate RapidAPI Proxy Secret header.
 * When RAPIDAPI_PROXY_SECRET is configured, enforces X-RapidAPI-Proxy-Secret on /v1/* routes
 * EXCEPT /v1/demo, /health, and /
 */
export function rapidApiSecurityMiddleware(req, res, next) {
  const secret = process.env.RAPIDAPI_PROXY_SECRET || config.rapidApiProxySecret;

  // If no secret configured, bypass check (e.g. local dev, test, or self-hosted deployment)
  if (!secret) {
    return next();
  }

  // Exempt routes (landing page, health check, demo, and studio static assets)
  const path = req.path || req.originalUrl || '';
  if (
    path === '/' ||
    path === '/health' ||
    path === '/studio.js' ||
    path === '/v1/demo' ||
    path.endsWith('/studio.js') ||
    path.endsWith('/demo') ||
    path.endsWith('/health')
  ) {
    return next();
  }

  const incomingSecret = req.headers['x-rapidapi-proxy-secret'];

  if (!incomingSecret || typeof incomingSecret !== 'string') {
    logger.warn('Request rejected: Missing X-RapidAPI-Proxy-Secret header', { path });
    return next(new UnauthorizedError('Missing required X-RapidAPI-Proxy-Secret header'));
  }

  try {
    const expectedBuffer = Buffer.from(secret, 'utf8');
    const incomingBuffer = Buffer.from(incomingSecret, 'utf8');

    // Use timingSafeEqual to avoid timing attack vulnerabilities
    if (
      expectedBuffer.length !== incomingBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, incomingBuffer)
    ) {
      logger.warn('Request rejected: Invalid X-RapidAPI-Proxy-Secret header', { path });
      return next(new UnauthorizedError('Invalid X-RapidAPI-Proxy-Secret header'));
    }

    return next();
  } catch (err) {
    logger.error('Security header comparison failed', { error: err.message });
    return next(new UnauthorizedError('Failed to verify X-RapidAPI-Proxy-Secret header'));
  }
}
