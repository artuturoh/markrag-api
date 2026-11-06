import axios from 'axios';
import { config } from '../config/index.js';
import { FetchError, FetchTimeoutError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const USER_AGENTS = [
  // Chrome Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  // Chrome macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  // Firefox Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  // Firefox macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0',
  // Safari macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  // Chrome Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

export class FetcherService {
  constructor(timeoutMs = config.fetchTimeoutMs) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Returns a random realistic User-Agent header from the pool
   */
  getRandomUserAgent() {
    const index = Math.floor(Math.random() * USER_AGENTS.length);
    return USER_AGENTS[index];
  }

  /**
   * Fetches raw HTML content from target URL with browser headers and strict timeout
   * @param {string} url Target URL
   * @param {Object} [options] Optional overrides
   * @returns {Promise<{ html: string, finalUrl: string, statusCode: number, contentType: string }>}
   */
  async fetch(url, options = {}) {
    const userAgent = options.userAgent || this.getRandomUserAgent();

    const headers = {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      ...options.headers,
    };

    try {
      logger.debug(`Fetching URL: ${url}`, { timeout: this.timeoutMs });

      const response = await axios.get(url, {
        headers,
        timeout: this.timeoutMs,
        maxRedirects: 5,
        maxContentLength: config.maxContentLengthBytes,
        responseType: 'text',
        decompress: true, // Native decompression of gzip, deflate, and brotli
        validateStatus: (status) => status >= 200 && status < 400, // Follow 2xx and 3xx
      });

      const contentType = response.headers['content-type'] || '';
      const html = typeof response.data === 'string' ? response.data : String(response.data);

      return {
        html,
        finalUrl: response.request?.res?.responseUrl || url,
        statusCode: response.status,
        contentType,
      };
    } catch (error) {
      this.handleFetchError(error, url);
    }
  }

  /**
   * Maps Axios and network errors to standardized AppError subclasses
   */
  handleFetchError(error, url) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      logger.warn(`Fetch timeout after ${this.timeoutMs}ms for ${url}`);
      throw new FetchTimeoutError(`Request to ${url} timed out after ${this.timeoutMs}ms`);
    }

    if (error.code === 'ENOTFOUND') {
      throw new FetchError(`Target domain could not be resolved (DNS lookup failed): ${url}`, 400);
    }

    if (error.code === 'ECONNREFUSED') {
      throw new FetchError(`Connection refused by target server: ${url}`, 502);
    }

    if (error.response) {
      const status = error.response.status;
      logger.warn(`Target responded with HTTP ${status} for ${url}`);
      throw new FetchError(
        `Target server responded with HTTP status ${status}`,
        status >= 500 ? 502 : status,
        { upstreamStatus: status }
      );
    }

    logger.error(`Network error while fetching ${url}`, { error: error.message, code: error.code });
    throw new FetchError(`Network error while fetching target URL: ${error.message}`, 502);
  }
}

export const fetcherService = new FetcherService();
