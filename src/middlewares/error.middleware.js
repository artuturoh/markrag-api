import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * 404 Not Found Middleware for unmatched routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: null,
    },
  });
}

/**
 * Centralized Global Error Handler
 */
export function errorHandler(err, req, res, next) {
  // If response has already started streaming, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError subclasses (ValidationError, FetchTimeoutError, UnprocessableContentError, etc.)
  if (err instanceof AppError) {
    logger.warn(`Handled application error: [${err.code}] ${err.message}`, {
      statusCode: err.statusCode,
      code: err.code,
      path: req.originalUrl,
      details: err.details,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle JSON parse errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload in request body',
        details: null,
      },
    });
  }

  // Handle unexpected internal server errors (500)
  logger.error('Unhandled server error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });

  const message = config.isProduction
    ? 'Internal server error occurred while processing your request'
    : err.message;

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      details: config.isProduction ? null : err.stack,
    },
  });
}
