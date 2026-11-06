import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanerService } from '../src/services/cleaner.service.js';
import { UnprocessableContentError } from '../src/utils/errors.js';

describe('CleanerService', () => {
  it('should extract article content and metadata from valid HTML', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Building Modern RAG Systems</title>
          <meta name="author" content="Jane Doe">
          <meta property="article:published_time" content="2024-05-01T12:00:00Z">
          <meta property="og:site_name" content="Tech Gazette">
        </head>
        <body>
          <nav>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
          <aside>
            <p>Ad banner: Buy our course today!</p>
          </aside>
          <main>
            <article>
              <h1>Building Modern RAG Systems</h1>
              <p class="byline">By Jane Doe</p>
              <p>Retrieval-Augmented Generation (RAG) combines dense vector search with language models to produce grounded answers.</p>
              <p>Vector databases store high-dimensional embeddings of text chunks for cosine similarity search.</p>
              <p>When query latency matters, pre-filtering metadata and re-ranking candidates significantly improves NDCG scores.</p>
            </article>
          </main>
          <footer>
            <p>© 2024 Tech Gazette. All rights reserved.</p>
          </footer>
        </body>
      </html>
    `;

    const result = cleanerService.clean(sampleHtml, 'https://example.com/article');

    assert.ok(result);
    assert.strictEqual(result.title, 'Building Modern RAG Systems');
    assert.strictEqual(result.siteName, 'Tech Gazette');
    assert.strictEqual(result.publishedTime, '2024-05-01T12:00:00Z');
    assert.strictEqual(result.lang, 'en');
    assert.ok(result.content.includes('Retrieval-Augmented Generation'));
    // Navigation, ads and footer should be stripped by Readability
    assert.strictEqual(result.content.includes('Buy our course today!'), false);
    assert.strictEqual(result.content.includes('All rights reserved'), false);
  });

  it('should throw UnprocessableContentError for empty or whitespace-only HTML', () => {
    assert.throws(
      () => cleanerService.clean('', 'https://example.com'),
      UnprocessableContentError
    );

    assert.throws(
      () => cleanerService.clean('   ', 'https://example.com'),
      UnprocessableContentError
    );
  });

  it('should throw UnprocessableContentError when page contains no readable article text', () => {
    const spaOnlyHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Loading App...</title></head>
        <body>
          <div id="root"></div>
          <script src="/bundle.js"></script>
        </body>
      </html>
    `;

    assert.throws(
      () => cleanerService.clean(spaOnlyHtml, 'https://example.com/spa'),
      UnprocessableContentError
    );
  });
});
