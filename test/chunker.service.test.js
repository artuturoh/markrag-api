import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkerService } from '../src/services/chunker.service.js';

describe('ChunkerService — Semantic & Hierarchy-Aware Chunking', () => {
  it('should return empty array for empty or whitespace-only markdown', () => {
    assert.deepStrictEqual(chunkerService.chunk(''), []);
    assert.deepStrictEqual(chunkerService.chunk('   \n\n  '), []);
  });

  it('should generate deterministic 16-character SHA-256 chunkIds', () => {
    const md = '# Title\n\nSome paragraph text.';
    const chunks1 = chunkerService.chunk(md, { canonicalUrl: 'https://example.com/test' });
    const chunks2 = chunkerService.chunk(md, { canonicalUrl: 'https://example.com/test' });

    assert.strictEqual(chunks1.length, 1);
    assert.strictEqual(chunks1[0].chunkId.length, 16);
    assert.strictEqual(/^[0-9a-f]{16}$/.test(chunks1[0].chunkId), true);
    assert.strictEqual(chunks1[0].chunkId, chunks2[0].chunkId);
  });

  it('should track heading breadcrumb hierarchy (H1 > H2 > H3)', () => {
    const md = `
# Architecture
This is the root architecture section detailing the complete pipeline design and microservices infrastructure.

## Storage Layer
Details about storage persistence, caching tiers, and memory-mapped file allocations.

### Vector Index
Qdrant and Pinecone are vector engines providing fast approximate nearest neighbors search.

## Compute Layer
Details about GPU clusters, inference nodes, and distributed worker execution.
    `.trim();

    const chunks = chunkerService.chunk(md, {
      chunkSizeTokens: 25, // Force splitting across sections
      chunkOverlapTokens: 0,
      canonicalUrl: 'https://example.com/docs',
    });

    assert.ok(chunks.length >= 3);

    // Verify heading breadcrumbs
    const headingsJoined = chunks.map((c) => c.headingPath.join(' > '));
    assert.ok(headingsJoined.some((h) => h === 'Architecture'));
    assert.ok(headingsJoined.some((h) => h === 'Architecture > Storage Layer > Vector Index'));
    assert.ok(headingsJoined.some((h) => h === 'Architecture > Compute Layer'));

    // Verify contextHeader format
    const chunkWithIndex = chunks.find((c) =>
      c.headingPath.includes('Vector Index')
    );
    assert.ok(chunkWithIndex);
    assert.strictEqual(
      chunkWithIndex.contextHeader,
      '[Section: Architecture > Storage Layer > Vector Index]\n'
    );
  });

  it('should NEVER split inside a fenced code block', () => {
    const md = `
# Code Section

Here is a critical code implementation that must remain intact:

\`\`\`python
def train_model(epochs, lr):
    for e in range(epochs):
        loss = step(lr)
        print(f"Epoch {e}: {loss}")
    return True
\`\`\`

Ending paragraph following the code block.
    `.trim();

    const chunks = chunkerService.chunk(md, {
      chunkSizeTokens: 40, // Small chunk budget
      chunkOverlapTokens: 0,
    });

    const codeChunk = chunks.find((c) => c.hasCodeBlock);
    assert.ok(codeChunk, 'Expected a chunk containing the code block');
    assert.ok(codeChunk.content.includes('```python'));
    assert.ok(codeChunk.content.includes('return True'));
    assert.ok(codeChunk.content.includes('```'));
    // Ensure code block is closed
    const tripleTicksCount = (codeChunk.content.match(/```/g) || []).length;
    assert.strictEqual(tripleTicksCount % 2, 0, 'Code block fences must be paired');
  });

  it('should NEVER split inside a Markdown table', () => {
    const md = `
# Benchmarks

| Database | QPS | Latency |
| --- | --- | --- |
| Qdrant | 4200 | 1.2ms |
| Pinecone | 3800 | 2.1ms |
| pgvector | 1950 | 3.4ms |

Follow-up notes.
    `.trim();

    const chunks = chunkerService.chunk(md, {
      chunkSizeTokens: 35,
      chunkOverlapTokens: 0,
    });

    const tableChunk = chunks.find((c) => c.hasTable);
    assert.ok(tableChunk, 'Expected a chunk containing the table');
    assert.ok(tableChunk.content.includes('| Database | QPS | Latency |'));
    assert.ok(tableChunk.content.includes('| pgvector | 1950 | 3.4ms |'));
  });
});
