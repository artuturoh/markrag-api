import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { fetcherService } from '../src/services/fetcher.service.js';
import { cacheService } from '../src/services/cache.service.js';
import { config } from '../src/config/index.js';

describe('MarkRAG API Endpoints', () => {
  let originalFetch;

  beforeEach(() => {
    cacheService.clear();
    originalFetch = fetcherService.fetch;
  });

  afterEach(() => {
    fetcherService.fetch = originalFetch;
    config.rapidApiProxySecret = null;
  });

  describe('GET / (Root Landing Page & Content Negotiation)', () => {
    it('should serve HTML landing page when Accept includes text/html', async () => {
      const res = await request(app)
        .get('/')
        .set('Accept', 'text/html,application/xhtml+xml');

      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('text/html'));
      assert.ok(res.text.includes('MarkRAG'));
      assert.ok(res.text.includes('All Systems Operational'));
      assert.ok(res.text.includes('RapidAPI'));
      assert.ok(res.text.includes('90%+'));
    });

    it('should serve JSON metadata when Accept is application/json', async () => {
      const res = await request(app)
        .get('/')
        .set('Accept', 'application/json');

      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('application/json'));
      assert.strictEqual(res.body.service, 'MarkRAG API');
      assert.strictEqual(res.body.status, 'online');
      assert.ok(res.body.endpoints);
      assert.ok(res.body.endpoints.extractPost);
      assert.ok(res.body.rapidApi);
    });

    it('should include customized Helmet CSP headers allowing unsafe-inline in script-src and script-src-attr', async () => {
      const res = await request(app).get('/');
      const csp = res.headers['content-security-policy'] || '';

      assert.ok(csp.includes('script-src'));
      assert.ok(csp.includes("'unsafe-inline'"));
      assert.ok(csp.includes('script-src-attr'));
      assert.ok(csp.includes('cdn.tailwindcss.com'));
      assert.ok(csp.includes('fonts.googleapis.com'));
      assert.ok(csp.includes('fonts.gstatic.com'));
    });
  });

  describe('GET /health', () => {
    it('should return 200 OK with health and memory statistics', async () => {
      const res = await request(app).get('/health');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.service, 'MarkRAG API');
      assert.ok(typeof res.body.uptimeSeconds === 'number');
      assert.ok(res.body.memory);
      assert.ok(res.body.cache);
    });
  });

  describe('POST /v1/extract - Validation & Security', () => {
    it('should return 400 Bad Request when url is missing', async () => {
      const res = await request(app)
        .post('/v1/extract')
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
      assert.ok(res.body.error.details.some((d) => d.field === 'url'));
    });

    it('should return 400 Bad Request when url protocol is not http or https', async () => {
      const res = await request(app)
        .post('/v1/extract')
        .send({ url: 'ftp://ftp.example.com/file.txt' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('should return 401 Unauthorized if RAPIDAPI_PROXY_SECRET is set and header is missing', async () => {
      config.rapidApiProxySecret = 'secret-rapid-api-123';

      const res = await request(app)
        .post('/v1/extract')
        .send({ url: 'https://example.com/blog' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
    });

    it('should return 401 Unauthorized if RAPIDAPI_PROXY_SECRET is set and header is incorrect', async () => {
      config.rapidApiProxySecret = 'secret-rapid-api-123';

      const res = await request(app)
        .post('/v1/extract')
        .set('x-rapidapi-proxy-secret', 'wrong-secret')
        .send({ url: 'https://example.com/blog' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
    });
  });

  describe('POST & GET /v1/extract - Extraction & Caching', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Introduction to Vector Search</title>
          <meta name="author" content="Alice Smith">
          <meta property="article:published_time" content="2024-04-10T10:00:00Z">
          <meta property="og:site_name" content="AI Engineering">
        </head>
        <body>
          <article>
            <h1>Introduction to Vector Search</h1>
            <p>Vector search is fundamental to semantic search and RAG architectures in modern enterprise AI pipelines.</p>
            <p>Check out the <a href="https://example.com/benchmark">vector benchmark</a> to learn more.</p>
            <table>
              <tr><th>Engine</th><th>QPS</th></tr>
              <tr><td>Qdrant</td><td>1500</td></tr>
            </table>
          </article>
        </body>
      </html>
    `;

    it('should extract article into structured markdown with token metrics via POST', async () => {
      fetcherService.fetch = async () => ({
        html: mockHtml,
        finalUrl: 'https://example.com/vector-search',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/v1/extract')
        .send({
          url: 'https://example.com/vector-search',
          options: { strip_links: false, include_html: true },
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const data = res.body.data;

      assert.strictEqual(data.title, 'Introduction to Vector Search');
      assert.strictEqual(data.siteName, 'AI Engineering');
      assert.strictEqual(data.publishedTime, '2024-04-10T10:00:00Z');
      assert.ok(data.markdown.includes('Vector search is fundamental'));
      assert.ok(data.markdown.includes('[vector benchmark](https://example.com/benchmark)'));
      assert.ok(data.markdown.includes('| Qdrant | 1500 |'));
      assert.ok(data.content.includes('<article>'));
      assert.strictEqual(data.metadata.cached, false);
      assert.ok(data.metadata.estimatedTokens > 0);
      assert.ok(data.metadata.savingsPercentage > 0);
    });

    it('should strip links when strip_links option is true', async () => {
      fetcherService.fetch = async () => ({
        html: mockHtml,
        finalUrl: 'https://example.com/vector-search',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/v1/extract')
        .send({
          url: 'https://example.com/vector-search',
          options: { strip_links: true },
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.markdown.includes('[vector benchmark]('), false);
      assert.ok(res.body.data.markdown.includes('vector benchmark'));
    });

    it('should serve cached content on subsequent requests with metadata.cached = true', async () => {
      let fetchCount = 0;
      fetcherService.fetch = async () => {
        fetchCount++;
        return {
          html: mockHtml,
          finalUrl: 'https://example.com/vector-search',
          statusCode: 200,
          contentType: 'text/html',
        };
      };

      // Request 1: Cache Miss
      const res1 = await request(app)
        .post('/v1/extract')
        .send({ url: 'https://example.com/vector-search' });

      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.data.metadata.cached, false);
      assert.strictEqual(fetchCount, 1);

      // Request 2: Cache Hit
      const res2 = await request(app)
        .post('/v1/extract')
        .send({ url: 'https://example.com/vector-search' });

      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.data.metadata.cached, true);
      // Fetcher should not have been called again
      assert.strictEqual(fetchCount, 1);
    });

    it('should support extraction via GET /v1/extract?url=...', async () => {
      fetcherService.fetch = async () => ({
        html: mockHtml,
        finalUrl: 'https://example.com/vector-search',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .get('/v1/extract')
        .query({
          url: 'https://example.com/vector-search',
          strip_links: 'true',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Introduction to Vector Search');
      assert.strictEqual(res.body.data.markdown.includes('[vector benchmark]('), false);
    });
  });
});
