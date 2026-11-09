import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { fetcherService } from '../src/services/fetcher.service.js';
import { config } from '../src/config/index.js';
import { resetDemoRateLimiter } from '../src/middleware/rapidapiAuth.js';

describe('MarkRAG v2.0 — POST /v1/extract-and-chunk & Studio Endpoints', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = fetcherService.fetch;
    config.rapidApiProxySecret = null;
    delete process.env.RAPIDAPI_PROXY_SECRET;
    resetDemoRateLimiter();
  });

  afterEach(() => {
    fetcherService.fetch = originalFetch;
    config.rapidApiProxySecret = null;
    delete process.env.RAPIDAPI_PROXY_SECRET;
    resetDemoRateLimiter();
  });

  const sampleValidHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Vector Search Architecture</title>
        <meta name="description" content="In-depth guide to dense retrieval">
        <meta property="article:published_time" content="2026-03-01T12:00:00Z">
        <meta property="og:site_name" content="AI Architecture Press">
        <link rel="canonical" href="https://example.com/vector-search">
      </head>
      <body>
        <nav><a href="/">Home</a><a href="/docs">Docs</a></nav>
        <aside class="advertisement"><p>Sponsored Ad Banner</p></aside>
        <main>
          <article>
            <h1>Vector Search Architecture</h1>
            <p>Vector databases store high-dimensional dense embeddings for semantic search in RAG pipelines. Retrieval-augmented generation combines pretrained language models with external vector search indexes, significantly reducing hallucinations and grounding LLM answers in verifiable factual sources.</p>
            <h2>Index Implementations</h2>
            <p>Hierarchical Navigable Small World (HNSW) graphs and Inverted File with Product Quantization (IVF-PQ) are the two most prevalent vector indexing algorithms used across production vector search engines like Qdrant and Pinecone. These indexes balance recall accuracy against query latency and memory consumption.</p>
            <p>When engineering high-throughput production retrieval pipelines, developers must account for vector dimensionalities, filtering predicates, distance metrics such as cosine similarity or inner product, and cross-encoder re-ranking stages to maximize mean reciprocal rank.</p>
            <table>
              <tr><th>Index</th><th>Recall</th></tr>
              <tr><td>HNSW</td><td>0.98</td></tr>
            </table>
            \`\`\`python
            def query_index(vec):
                return client.search(vec)
            \`\`\`
          </article>
        </main>
        <footer><p>&copy; 2026 AI Architecture Press</p></footer>
      </body>
    </html>
  `;

  it('should return 400 Bad Request when neither url nor html is provided', async () => {
    const res = await request(app)
      .post('/v1/extract-and-chunk')
      .send({});

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('should parse raw HTML directly without making external network requests', async () => {
    let networkCallMade = false;
    fetcherService.fetch = async () => {
      networkCallMade = true;
      throw new Error('Network should not be called when raw HTML is supplied');
    };

    const res = await request(app)
      .post('/v1/extract-and-chunk')
      .send({
        html: sampleValidHtml,
        url: 'https://example.com/vector-search',
        options: { chunkSizeTokens: 512 },
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(networkCallMade, false);
    assert.strictEqual(res.body.success, true);
    const data = res.body.data;

    // Verify metadata intelligence
    assert.strictEqual(data.metadata.title, 'Vector Search Architecture');
    assert.strictEqual(data.metadata.canonicalUrl, 'https://example.com/vector-search');
    assert.strictEqual(data.metadata.siteName, 'AI Architecture Press');
    assert.ok(data.metadata.citation.markdown.includes('[Vector Search Architecture]'));
    assert.ok(data.metadata.linksSummary);

    // Verify cleaning & boilerplate removal
    assert.strictEqual(data.markdown.includes('Sponsored Ad Banner'), false);
    assert.strictEqual(data.markdown.includes('Home'), false);
    assert.ok(data.markdown.includes('Vector databases store high-dimensional'));
    assert.ok(data.cleaningStats.removedElements.navs >= 1);
    assert.ok(data.cleaningStats.removedElements.footers >= 1);
    assert.ok(data.cleaningStats.tokensSaved > 0);
    assert.ok(data.cleaningStats.compressionRatioPercentage > 40);

    // Verify semantic chunks
    assert.ok(data.chunks.length >= 1);
    const firstChunk = data.chunks[0];
    assert.strictEqual(firstChunk.index, 0);
    assert.strictEqual(firstChunk.chunkId.length, 16);
    assert.ok(firstChunk.tokenCount > 0);
    assert.ok(Array.isArray(firstChunk.headingPath));

    // Verify diagnostics
    assert.strictEqual(data.qualityDiagnostics.status, 'optimal');
    assert.strictEqual(data.qualityDiagnostics.flags.hasStructuredHeadings, true);
    assert.ok(data.qualityDiagnostics.ragReadinessScore >= 80);
    assert.strictEqual(data.meta.version, '2.0.0');
  });

  it('should produce quality diagnostic warnings for thin and SPA JavaScript shells', async () => {
    const thinSpaHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Loading Application...</title></head>
        <body>
          <div id="root"></div>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <script src="/static/js/bundle.js"></script>
        </body>
      </html>
    `;

    const res = await request(app)
      .post('/v1/extract-and-chunk')
      .send({
        html: thinSpaHtml,
        url: 'https://example.com/spa-app',
      });

    assert.strictEqual(res.status, 200);
    const diagnostics = res.body.data.qualityDiagnostics;
    assert.strictEqual(diagnostics.flags.requiresJavaScriptSpaShell, true);
    assert.strictEqual(diagnostics.flags.isEmptyOrThinContent, true);
    assert.ok(diagnostics.warnings.length >= 1);
    assert.ok(diagnostics.ragReadinessScore < 50);
    assert.strictEqual(diagnostics.status, 'poor');
  });

  it('should work via alias routes POST /extract-and-chunk and POST /v1/parse', async () => {
    const resAlias = await request(app)
      .post('/extract-and-chunk')
      .send({ html: sampleValidHtml, url: 'https://example.com/vector-search' });

    assert.strictEqual(resAlias.status, 200);
    assert.ok(resAlias.body.data.chunks.length >= 1);

    fetcherService.fetch = async () => ({
      html: sampleValidHtml,
      finalUrl: 'https://example.com/vector-search',
      statusCode: 200,
      contentType: 'text/html',
    });

    const resParse = await request(app)
      .post('/v1/parse')
      .send({ url: 'https://example.com/vector-search' });

    assert.strictEqual(resParse.status, 200);
    assert.ok(resParse.body.data.markdown);
  });

  it('should enforce RAPIDAPI_PROXY_SECRET on /v1/extract-and-chunk while allowing /v1/demo', async () => {
    process.env.RAPIDAPI_PROXY_SECRET = 'rapid-secret-xyz';
    config.rapidApiProxySecret = 'rapid-secret-xyz';

    // 1. /v1/extract-and-chunk without secret -> 401
    const resNoSecret = await request(app)
      .post('/v1/extract-and-chunk')
      .send({ html: sampleValidHtml });

    assert.strictEqual(resNoSecret.status, 401);
    assert.strictEqual(resNoSecret.body.error.code, 'UNAUTHORIZED');

    // 2. /v1/extract-and-chunk with valid secret -> 200
    const resWithSecret = await request(app)
      .post('/v1/extract-and-chunk')
      .set('x-rapidapi-proxy-secret', 'rapid-secret-xyz')
      .send({ html: sampleValidHtml });

    assert.strictEqual(resWithSecret.status, 200);

    // 3. /v1/demo without secret -> 200 (exempt for live studio)
    const resDemo = await request(app)
      .post('/v1/demo')
      .send({ html: sampleValidHtml });

    assert.strictEqual(resDemo.status, 200);
    assert.ok(resDemo.body.data.chunks.length >= 1);
  });

  it('should rate-limit /v1/demo to 15 requests per minute per IP', async () => {
    resetDemoRateLimiter();

    // Send 15 requests -> all should succeed
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post('/v1/demo')
        .send({ html: sampleValidHtml });
      assert.strictEqual(res.status, 200, `Request #${i + 1} should succeed`);
    }

    // 16th request must trigger 429 Too Many Requests
    const resOverLimit = await request(app)
      .post('/v1/demo')
      .send({ html: sampleValidHtml });

    assert.strictEqual(resOverLimit.status, 429);
    assert.strictEqual(resOverLimit.body.error.code, 'RATE_LIMIT_EXCEEDED');
  });

  it('should accurately parse rich multi-section HTML articles with ~85-90% token compression ratio', async () => {
    resetDemoRateLimiter();

    const richArticle = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Architecture of Modern Production RAG Systems</title>
          <meta name="author" content="Dr. Elena Vance">
          <meta name="description" content="A comprehensive engineering deep dive into high-throughput Retrieval-Augmented Generation">
          <link rel="canonical" href="https://systems.example.ai/articles/modern-rag-architecture">
          <style>
            ${'/* boilerplate noise stylesheet for responsive web layout and animations */\n.nav-item { color: #333; display: flex; margin: 10px; padding: 5px; }\n'.repeat(60)}
          </style>
          <script>
            ${'// analytics, telemetry, tag managers, and ad tracking network payloads\nwindow.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);}\n'.repeat(60)}
          </script>
        </head>
        <body>
          <nav>
            <a href="/">Home</a>
            ${'<a href="/section">Section Link</a>\n'.repeat(20)}
          </nav>
          <aside class="advertisement">
            <p>Buy cloud compute and GPUs today!</p>
          </aside>
          <main>
            <article>
              <h1>Architecture of Modern Production RAG Systems</h1>
              <p>Retrieval-Augmented Generation (RAG) grounds pretrained large language models with external vector search indexes, achieving factual accuracy while minimizing fine-tuning costs across enterprise deployments.</p>
              <p>By coupling neural information retrieval with high-capacity generative transformers, production AI systems can dynamically inject verifiable, domain-specific contextual knowledge into LLM prompts at inference time without requiring parameter retraining or complex gradient updates.</p>
              <h2>1. The Knowledge Ingestion and Chunking Dilemma</h2>
              <p>When engineering an ingestion pipeline, documents must be converted into clean Markdown before semantic chunking. Standard naive character splitting regularly fragments code blocks, truncates tables, and loses the section hierarchy necessary for contextual retrieval.</p>
              <p>Hierarchy-aware semantic chunking guarantees that document boundaries and section titles are tracked across nested sections, providing enriched embedding vectors that significantly enhance recall metrics across multi-hop reasoning tasks.</p>
              <h2>2. Benchmark Comparison of Production Vector Indexes</h2>
              <table>
                <thead>
                  <tr><th>Vector Database</th><th>Index Algorithm</th><th>Recall @ 10</th></tr>
                </thead>
                <tbody>
                  <tr><td>Qdrant Cloud</td><td>HNSW</td><td>0.984</td></tr>
                  <tr><td>Pinecone</td><td>HNSW</td><td>0.978</td></tr>
                </tbody>
              </table>
              <h2>3. Idempotent Vector Upsert Implementation</h2>
              \`\`\`python
              def upsert_records(client, chunks):
                  return client.upsert(chunks)
              \`\`\`
            </article>
          </main>
          <footer>
            ${'<p>&copy; 2026 AI Systems Engineering Review. All rights reserved.</p>\n'.repeat(10)}
          </footer>
        </body>
      </html>
    `;

    const res = await request(app)
      .post('/v1/demo')
      .send({
        html: richArticle,
        url: 'https://systems.example.ai/articles/modern-rag-architecture',
        options: { chunkSizeTokens: 512 }
      });

    assert.strictEqual(res.status, 200);
    const data = res.body.data;
    assert.strictEqual(data.metadata.title, 'Architecture of Modern Production RAG Systems');
    assert.strictEqual(data.metadata.author, 'Dr. Elena Vance');
    assert.ok(data.chunks.length >= 1);
    assert.ok(data.cleaningStats.compressionRatioPercentage >= 80, `Expected >= 80% compression, got ${data.cleaningStats.compressionRatioPercentage}%`);
    assert.ok(data.cleaningStats.tokensSaved > 500);
    assert.ok(data.cleaningStats.removedElements.scripts >= 1);
    assert.ok(data.cleaningStats.removedElements.navs >= 1);
    assert.strictEqual(data.qualityDiagnostics.status, 'optimal');
  });
});
