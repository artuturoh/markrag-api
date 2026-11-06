/**
 * Minimalist, high-performance structured logger
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info');

function shouldLog(level) {
  return LOG_LEVELS[level] <= (LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info);
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  }
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info(message, meta) {
    if (shouldLog('info')) console.log(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    if (shouldLog('error')) console.error(formatMessage('error', message, meta));
  },
  debug(message, meta) {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message, meta));
  },
};
