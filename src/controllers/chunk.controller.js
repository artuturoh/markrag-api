import { fetcherService } from '../services/fetcher.service.js';
import { cleanerService } from '../services/cleaner.service.js';
import { markdownService } from '../services/markdown.service.js';
import { intelligenceService } from '../services/intelligence.service.js';
import { chunkerService } from '../services/chunker.service.js';
import { logger } from '../utils/logger.js';

export class ChunkController {
  /**
   * Flagship endpoint: POST /v1/extract-and-chunk
   * Extracts clean Markdown, rich metadata, token diagnostics, and semantic chunks.
   */
  async extractAndChunk(req, res, next) {
    const startTime = Date.now();
    const { url, html, options = {} } = req.validatedData;

    try {
      let rawHtml = html;
      let targetUrl = url;

      // Step 1: If raw HTML not provided, fetch using browser emulation and timeout protection
      if (!rawHtml || typeof rawHtml !== 'string') {
        logger.debug(`Fetching URL for extract-and-chunk: ${url}`);
        const fetched = await fetcherService.fetch(url, {
          userAgent: options.user_agent,
        });
        rawHtml = fetched.html;
        targetUrl = fetched.finalUrl || url;
      } else if (!targetUrl) {
        targetUrl = 'https://example.com/document';
      }

      // Step 2: Extract article content and DOM using enhanced cleaner
      const cleaned = cleanerService.cleanEnhanced(rawHtml, targetUrl, options);

      // Step 3: Convert clean HTML to GitHub Flavored Markdown
      const markdown = markdownService.convertToMarkdown(cleaned.content, {
        includeLinks: options.includeLinks,
        includeImages: options.includeImages,
        strip_links: options.strip_links,
      });

      // Step 4: Metadata Intelligence, Cleaning Stats, and RAG Quality Diagnostics
      const intelligence = intelligenceService.analyze({
        document: cleaned.document,
        rawHtml,
        targetUrl,
        readabilityArticle: cleaned.article,
        cleanMarkdown: markdown,
      });

      // Step 5: Hierarchy-Aware Semantic Chunking
      const canonicalUrl = intelligence.metadata.canonicalUrl || targetUrl;
      const chunks = chunkerService.chunk(markdown, {
        chunkSizeTokens: options.chunkSizeTokens,
        chunkOverlapTokens: options.chunkOverlapTokens,
        canonicalUrl,
      });

      const executionTimeMs = Date.now() - startTime;

      logger.info(`Extract-and-chunk complete for ${canonicalUrl}`, {
        chunksCount: chunks.length,
        ragScore: intelligence.qualityDiagnostics.ragReadinessScore,
        latencyMs: executionTimeMs,
      });

      return res.status(200).json({
        success: true,
        data: {
          markdown,
          metadata: intelligence.metadata,
          chunks,
          cleaningStats: intelligence.cleaningStats,
          tokenMetrics: intelligence.tokenMetrics,
          qualityDiagnostics: intelligence.qualityDiagnostics,
          meta: {
            execution_time_ms: executionTimeMs,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chunkController = new ChunkController();
