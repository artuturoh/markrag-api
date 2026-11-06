import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tokenService } from '../src/services/token.service.js';

describe('TokenService', () => {
  it('should accurately count words in markdown content', () => {
    const markdown = `# Title\n\nThis is a sample markdown with five words.`;
    const count = tokenService.countWords(markdown);
    // "Title", "This", "is", "a", "sample", "markdown", "with", "five", "words" = 9 words
    assert.strictEqual(count, 9);
  });

  it('should estimate reading time based on 200 WPM', () => {
    assert.strictEqual(tokenService.calculateReadingTime(0), 0);
    assert.strictEqual(tokenService.calculateReadingTime(150), 1);
    assert.strictEqual(tokenService.calculateReadingTime(450), 3);
  });

  it('should estimate token count using ~4 chars per token rule', () => {
    const text = '12345678'; // 8 chars -> 2 tokens
    assert.strictEqual(tokenService.estimateTokens(text), 2);
    assert.strictEqual(tokenService.estimateTokens(''), 0);
  });

  it('should calculate tokens saved and savings percentage vs raw HTML', () => {
    const rawHtml = '<html><head><script>lotsOfJs();</script><nav>nav links</nav></head><body>' + 'x'.repeat(4000) + '</body></html>';
    const cleanMarkdown = 'x'.repeat(800);

    const metrics = tokenService.calculateMetrics(cleanMarkdown, rawHtml);

    assert.ok(metrics.rawHtmlTokens > metrics.estimatedTokens);
    assert.ok(metrics.tokensSaved > 0);
    assert.ok(metrics.savingsPercentage > 50);
  });
});
