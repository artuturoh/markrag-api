import { LRUCache } from 'lru-cache';
import { config } from '../config/index.js';

export class CacheService {
  constructor(options = {}) {
    this.cache = new LRUCache({
      max: options.max || config.cache.maxItems,
      ttl: options.ttl || config.cache.ttlMs, // Default 15 minutes
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    });
  }

  /**
   * Generates a deterministic cache key based on URL and extraction options
   */
  generateKey(url, options = {}) {
    const stripLinks = Boolean(options.strip_links);
    const includeHtml = Boolean(options.include_html);
    return `${url}::stripLinks=${stripLinks}::includeHtml=${includeHtml}`;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl) {
    this.cache.set(key, value, { ttl });
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const cacheService = new CacheService();
