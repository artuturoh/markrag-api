import { fetcherService } from '../services/fetcher.service.js';
import { cleanerService } from '../services/cleaner.service.js';
import { markdownService } from '../services/markdown.service.js';
import { tokenService } from '../services/token.service.js';
import { cacheService } from '../services/cache.service.js';
import { logger } from '../utils/logger.js';

export class ExtractController {
  /**
   * Main handler for extracting articles into Markdown and RAG metadata
   */
  async extract(req, res, next) {
    const startTime = Date.now();
    const { url, options = {} } = req.validatedData;
    const useCache = options.cache !== false;

    try {
      const cacheKey = cacheService.generateKey(url, options);

      // Check LRU Cache
      if (useCache && cacheService.has(cacheKey)) {
        const cachedData = cacheService.get(cacheKey);
        logger.info(`Cache hit for ${url}`, { durationMs: Date.now() - startTime });

        return res.status(200).json({
          success: true,
          data: {
            ...cachedData,
            metadata: {
              ...cachedData.metadata,
              cached: true,
              responseTimeMs: Date.now() - startTime,
            },
          },
        });
      }

      // Step 1: Fetch raw HTML with real browser headers & timeout
      const { html: rawHtml, finalUrl } = await fetcherService.fetch(url, {
        userAgent: options.user_agent,
      });

      // Step 2: Extract core readable content via Mozilla Readability
      const cleaned = cleanerService.clean(rawHtml, finalUrl);

      // Step 3: Convert clean HTML to GitHub Flavored Markdown
      const markdown = markdownService.convertToMarkdown(cleaned.content, {
        strip_links: options.strip_links,
      });

      // Step 4: Calculate RAG token & efficiency metrics
      const tokenMetrics = tokenService.calculateMetrics(markdown, rawHtml);

      const responsePayload = {
        url: finalUrl,
        title: cleaned.title,
        byline: cleaned.byline,
        siteName: cleaned.siteName,
        publishedTime: cleaned.publishedTime,
        lang: cleaned.lang,
        dir: cleaned.dir,
        excerpt: cleaned.excerpt,
        markdown,
        ...(options.include_html ? { content: cleaned.content } : {}),
        metadata: {
          ...tokenMetrics,
          cached: false,
          responseTimeMs: Date.now() - startTime,
        },
      };

      // Store in LRU cache
      if (useCache) {
        cacheService.set(cacheKey, responsePayload);
      }

      logger.info(`Extracted ${url} successfully`, {
        tokens: tokenMetrics.estimatedTokens,
        savings: `${tokenMetrics.savingsPercentage}%`,
        durationMs: Date.now() - startTime,
      });

      return res.status(200).json({
        success: true,
        data: responsePayload,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const extractController = new ExtractController();
