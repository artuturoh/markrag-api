import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  rapidApiProxySecret: process.env.RAPIDAPI_PROXY_SECRET || null,
  fetchTimeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS || '5000', 10),
  maxContentLengthBytes: parseInt(process.env.MAX_CONTENT_LENGTH_BYTES || '10485760', 10), // 10MB
  cache: {
    ttlMs: parseInt(process.env.CACHE_TTL_MS || '900000', 10), // 15 minutes
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },
};
