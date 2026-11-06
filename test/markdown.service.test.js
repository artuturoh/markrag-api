import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { markdownService } from '../src/services/markdown.service.js';

describe('MarkdownService', () => {
  it('should convert HTML headings, paragraphs, and lists to Markdown', () => {
    const html = `
      <h1>Main Title</h1>
      <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
    `;

    const md = markdownService.convertToMarkdown(html);

    assert.ok(md.includes('# Main Title'));
    assert.ok(md.includes('**bold**'));
    assert.ok(md.includes('*italic*'));
    assert.ok(md.includes('- First item'));
    assert.ok(md.includes('- Second item'));
  });

  it('should convert HTML tables to GitHub Flavored Markdown tables', () => {
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Context Window</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gemini 1.5 Pro</td>
            <td>2,000,000</td>
            <td>Fast</td>
          </tr>
          <tr>
            <td>GPT-4o</td>
            <td>128,000</td>
            <td>Very Fast</td>
          </tr>
        </tbody>
      </table>
    `;

    const md = markdownService.convertToMarkdown(tableHtml);

    assert.ok(md.includes('| Model | Context Window | Speed |'));
    assert.ok(md.includes('| --- | --- | --- |') || md.includes('| --- |'));
    assert.ok(md.includes('| Gemini 1.5 Pro | 2,000,000 | Fast |'));
  });

  it('should preserve language identifier in fenced code blocks', () => {
    const codeHtml = `
      <pre><code class="language-python">def generate_embeddings(text):
    return client.embeddings.create(input=text)</code></pre>
    `;

    const md = markdownService.convertToMarkdown(codeHtml);

    assert.ok(md.includes('```python'));
    assert.ok(md.includes('def generate_embeddings(text):'));
    assert.ok(md.includes('```'));
  });

  it('should preserve links when strip_links is false', () => {
    const html = `<p>Check our <a href="https://example.com/docs">documentation</a> for more details.</p>`;
    const md = markdownService.convertToMarkdown(html, { strip_links: false });

    assert.ok(md.includes('[documentation](https://example.com/docs)'));
  });

  it('should strip links to plain text when strip_links is true to save LLM tokens', () => {
    const html = `<p>Check our <a href="https://example.com/docs">documentation</a> for more details.</p>`;
    const md = markdownService.convertToMarkdown(html, { strip_links: true });

    assert.ok(md.includes('documentation'));
    assert.strictEqual(md.includes('[documentation](https://example.com/docs)'), false);
    assert.strictEqual(md.includes('https://example.com/docs'), false);
  });

  it('should normalize multiple consecutive newlines', () => {
    const html = `<p>Paragraph 1</p><br><br><br><br><p>Paragraph 2</p>`;
    const md = markdownService.convertToMarkdown(html);

    // Should not contain 3 or more consecutive newlines
    assert.strictEqual(/\n{3,}/.test(md), false);
  });
});
