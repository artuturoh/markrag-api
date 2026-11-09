import crypto from 'crypto';

/**
 * Semantic Chunker Service for RAG & Vector Databases.
 * Respects Markdown heading hierarchies, paragraphs, code blocks, and tables.
 * Never splits inside a fenced code block or table row.
 */
export class ChunkerService {
  /**
   * Estimates token count (~4 characters per token heuristic)
   */
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Generates a deterministic 16-character SHA-256 hex digest
   */
  generateChunkId(canonicalUrl, headingPath, content) {
    const raw = `${canonicalUrl || ''}::${(headingPath || []).join(' > ')}::${content || ''}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  }

  /**
   * Splits clean Markdown into semantic chunks respecting heading hierarchy
   * @param {string} markdown
   * @param {Object} [options]
   * @param {number} [options.chunkSizeTokens=512]
   * @param {number} [options.chunkOverlapTokens=50]
   * @param {string} [options.canonicalUrl='']
   * @returns {Array<Object>} Array of chunk objects
   */
  chunk(markdown, options = {}) {
    if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0) {
      return [];
    }

    const chunkSize = Math.max(16, options.chunkSizeTokens || 512);
    const chunkOverlap = Math.min(Math.floor(chunkSize / 2), Math.max(0, options.chunkOverlapTokens ?? 50));
    const canonicalUrl = options.canonicalUrl || '';

    // Step 1: Parse markdown into atomic blocks while tracking heading levels
    const blocks = this.parseAtomicBlocks(markdown);
    if (blocks.length === 0) return [];

    const chunks = [];
    let currentBlocks = [];
    let currentTokens = 0;
    let currentHeadingPath = [];

    const finalizeChunk = () => {
      if (currentBlocks.length === 0) return;

      const chunkContent = currentBlocks.map((b) => b.text).join('\n\n').trim();
      if (!chunkContent) return;

      const charCount = chunkContent.length;
      const tokenCount = this.estimateTokens(chunkContent);
      const headingPath =
        currentBlocks[currentBlocks.length - 1]?.headingPath ||
        [...currentHeadingPath];
      const contextHeader =
        headingPath.length > 0 ? `[Section: ${headingPath.join(' > ')}]\n` : '';
      const chunkId = this.generateChunkId(canonicalUrl, headingPath, chunkContent);
      const hasCodeBlock = chunkContent.includes('```');
      const hasTable = /(^|\n)\|.+?\|/m.test(chunkContent);

      chunks.push({
        index: chunks.length,
        chunkId,
        headingPath,
        contextHeader,
        content: chunkContent,
        tokenCount,
        charCount,
        hasCodeBlock,
        hasTable,
      });

      // Prepare overlap blocks for next chunk
      if (chunkOverlap > 0 && currentBlocks.length > 1) {
        let overlapTokens = 0;
        const overlapBlocks = [];
        // Walk backwards through current blocks to find overlap within chunkOverlap limit
        for (let i = currentBlocks.length - 1; i >= 0; i--) {
          const blk = currentBlocks[i];
          if (overlapTokens + blk.tokens <= chunkOverlap) {
            overlapBlocks.unshift(blk);
            overlapTokens += blk.tokens;
          } else {
            break;
          }
        }
        currentBlocks = overlapBlocks;
        currentTokens = overlapTokens;
      } else {
        currentBlocks = [];
        currentTokens = 0;
      }
    };

    for (const block of blocks) {
      // Update active heading path when a heading block is encountered
      if (block.isHeading) {
        currentHeadingPath = this.updateHeadingHierarchy(currentHeadingPath, block.headingLevel, block.headingText);
      }
      block.headingPath = [...currentHeadingPath];

      // If adding this block would exceed chunk size (and we already have blocks)
      if (currentTokens + block.tokens > chunkSize && currentBlocks.length > 0) {
        finalizeChunk();
      }

      currentBlocks.push(block);
      currentTokens += block.tokens;
    }

    // Finalize any remaining content
    if (currentBlocks.length > 0) {
      finalizeChunk();
    }

    return chunks;
  }

  /**
   * Parses markdown into atomic units (headings, code blocks, tables, lists, paragraphs)
   */
  parseAtomicBlocks(markdown) {
    const lines = markdown.split(/\r?\n/);
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Fenced Code Block: keep entirely atomic from ``` to closing ```
      if (line.trim().startsWith('```')) {
        const codeLines = [line];
        i++;
        while (i < lines.length) {
          codeLines.push(lines[i]);
          if (lines[i].trim().startsWith('```')) {
            i++;
            break;
          }
          i++;
        }
        const text = codeLines.join('\n');
        blocks.push({
          type: 'code',
          text,
          tokens: this.estimateTokens(text),
          isHeading: false,
        });
        continue;
      }

      // 2. Markdown Table: keep all contiguous rows atomic
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [line];
        i++;
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        const text = tableLines.join('\n');
        blocks.push({
          type: 'table',
          text,
          tokens: this.estimateTokens(text),
          isHeading: false,
        });
        continue;
      }

      // 3. Headings: # H1, ## H2, ### H3, etc.
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        blocks.push({
          type: 'heading',
          text: line,
          tokens: this.estimateTokens(line),
          isHeading: true,
          headingLevel: level,
          headingText,
        });
        i++;
        continue;
      }

      // 4. Blank lines: skip
      if (!line.trim()) {
        i++;
        continue;
      }

      // 5. Paragraphs or contiguous list items
      const paraLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('|') &&
        !lines[i].match(/^#{1,6}\s+/)
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      const text = paraLines.join('\n');
      blocks.push({
        type: 'paragraph',
        text,
        tokens: this.estimateTokens(text),
        isHeading: false,
      });
    }

    return blocks;
  }

  /**
   * Updates the heading stack maintaining true hierarchy levels:
   * e.g. H1 > H2 > H3; if a new H2 appears, pop H3 and replace H2.
   */
  updateHeadingHierarchy(currentPath, newLevel, newTitle) {
    const updated = [...currentPath];
    // Cap to parent level: level 1 means slice(0, 0), level 2 means slice(0, 1), etc.
    const parentDepth = Math.max(0, newLevel - 1);
    const newHierarchy = updated.slice(0, parentDepth);
    newHierarchy.push(newTitle);
    return newHierarchy;
  }
}

export const chunkerService = new ChunkerService();
