import crypto from 'crypto';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Security Middleware to validate RapidAPI Proxy Secret header.
 * If RAPIDAPI_PROXY_SECRET is configured in the environment,
 * incoming requests MUST contain matching 'x-rapidapi-proxy-secret' header.
 */
export function rapidApiSecurityMiddleware(req, res, next) {
  const secret = config.rapidApiProxySecret;

  // If no secret configured, bypass check (e.g. local dev, test, or self-hosted deployment)
  if (!secret) {
    return next();
  }

  const incomingSecret = req.headers['x-rapidapi-proxy-secret'];

  if (!incomingSecret || typeof incomingSecret !== 'string') {
    logger.warn('Request rejected: Missing X-RapidAPI-Proxy-Secret header', { path: req.path });
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
      logger.warn('Request rejected: Invalid X-RapidAPI-Proxy-Secret header', { path: req.path });
      return next(new UnauthorizedError('Invalid X-RapidAPI-Proxy-Secret header'));
    }

    return next();
  } catch (err) {
    logger.error('Security header comparison failed', { error: err.message });
    return next(new UnauthorizedError('Failed to verify X-RapidAPI-Proxy-Secret header'));
  }
}
