/**
 * Base application error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request: Input validation failures
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Unauthorized: RapidAPI secret invalid or missing
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized: Invalid RapidAPI proxy secret') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 422 Unprocessable Content: Page fetched successfully but contains no readable article text
 * (e.g., pure JavaScript single-page apps without SSR, CAPTCHA/bot walls, or empty documents)
 */
export class UnprocessableContentError extends AppError {
  constructor(message = 'Unable to extract readable article content from the specified URL') {
    super(message, 422, 'UNPROCESSABLE_CONTENT');
  }
}

/**
 * 504 Gateway Timeout: Upstream target took longer than the configured timeout (5s)
 */
export class FetchTimeoutError extends AppError {
  constructor(message = 'Request to the target URL timed out after 5 seconds') {
    super(message, 504, 'FETCH_TIMEOUT');
  }
}

/**
 * 502 Bad Gateway: Upstream network failures or invalid responses
 */
export class FetchError extends AppError {
  constructor(message, statusCode = 502, details = null) {
    super(message, statusCode, 'FETCH_ERROR', details);
  }
}
