import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { UnprocessableContentError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class CleanerService {
  /**
   * Cleans raw HTML and extracts the main article content using Mozilla Readability
   * @param {string} html Raw HTML string
   * @param {string} url Target URL (for resolving relative links)
   * @returns {Object} Cleaned article content and metadata
   */
  clean(html, url) {
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      throw new UnprocessableContentError('Empty or invalid HTML content received');
    }

    try {
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      // Extract metadata before Readability modifies the DOM
      const metadata = this.extractDocumentMetadata(document);

      // Run Mozilla Readability (same engine as Firefox Reader View)
      const reader = new Readability(document, {
        keepClasses: false,
        charThreshold: 50,
      });

      const article = reader.parse();

      if (!article || !article.content || !article.textContent?.trim()) {
        logger.warn(`Readability failed to extract article from ${url}`);
        throw new UnprocessableContentError(
          'Could not extract readable article content. The page may be an empty document, require JavaScript execution (SPA), or be protected by a bot wall/paywall.'
        );
      }

      const publishedTime = metadata.publishedTime || article.publishedTime || null;
      const byline = article.byline || metadata.author || null;
      const siteName = article.siteName || metadata.siteName || null;
      const title = article.title || metadata.title || 'Untitled Document';
      const excerpt = article.excerpt || metadata.description || null;

      return {
        title,
        byline,
        siteName,
        publishedTime,
        dir: article.dir || metadata.dir || null,
        lang: metadata.lang || null,
        excerpt,
        content: article.content, // Cleaned HTML from Readability
        textContent: article.textContent.trim(), // Raw cleaned text
      };
    } catch (error) {
      if (error instanceof UnprocessableContentError) {
        throw error;
      }
      logger.error('Error during DOM parsing / cleaning', { error: error.message, url });
      throw new UnprocessableContentError(`Failed to parse HTML document: ${error.message}`);
    }
  }

  /**
   * Enhanced cleaner for MarkRAG v2.0
   * Preserves DOM access for metadata & diagnostics, falls back gracefully on thin/stub content.
   */
  cleanEnhanced(html, url, options = {}) {
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      throw new UnprocessableContentError('Empty or invalid HTML content received');
    }

    try {
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      // Extract metadata before Readability modifies DOM
      const metadata = this.extractDocumentMetadata(document);

      // Clone document for Readability so original DOM retains all noise elements (scripts, styles, navs, footers, ads) for intelligence analysis
      const readerDoc = document.cloneNode(true);
      const reader = new Readability(readerDoc, {
        keepClasses: false,
        charThreshold: 30,
      });

      const article = reader.parse();

      let content = article?.content || '';
      let textContent = article?.textContent?.trim() || '';

      // If readability failed (e.g. thin content, simple fragment or paywall notice), fallback to body
      if (!content || !textContent) {
        const bodyEl = document.querySelector('body') || document.documentElement;
        if (bodyEl) {
          // Clone to avoid mutating original
          const clone = bodyEl.cloneNode(true);
          // Strip unwanted noisy tags
          const noisy = clone.querySelectorAll('script, style, noscript, svg');
          noisy.forEach((el) => el.remove());
          content = clone.innerHTML;
          textContent = clone.textContent.trim();
        }
      }

      return {
        dom,
        document,
        article,
        title: article?.title || metadata.title || 'Untitled Document',
        byline: article?.byline || metadata.author || null,
        siteName: article?.siteName || metadata.siteName || null,
        publishedTime: metadata.publishedTime || article?.publishedTime || null,
        dir: article?.dir || metadata.dir || null,
        lang: metadata.lang || null,
        excerpt: article?.excerpt || metadata.description || null,
        content,
        textContent,
      };
    } catch (error) {
      if (error instanceof UnprocessableContentError) throw error;
      logger.error('Error during enhanced DOM parsing / cleaning', { error: error.message, url });
      throw new UnprocessableContentError(`Failed to parse HTML document: ${error.message}`);
    }
  }

  /**
   * Extracts useful metadata from document head and OpenGraph/Schema tags
   */
  extractDocumentMetadata(document) {
    const meta = (selector, attr = 'content') => {
      const el = document.querySelector(selector);
      return el ? el.getAttribute(attr) : null;
    };

    const publishedTime =
      meta('meta[property="article:published_time"]') ||
      meta('meta[name="publication_date"]') ||
      meta('meta[name="date"]') ||
      meta('meta[property="og:published_time"]') ||
      meta('meta[name="DC.date.issued"]') ||
      document.querySelector('time[datetime]')?.getAttribute('datetime') ||
      this.extractJsonLdPublishedTime(document);

    const author =
      meta('meta[name="author"]') ||
      meta('meta[property="article:author"]') ||
      meta('meta[name="twitter:creator"]');

    const siteName =
      meta('meta[property="og:site_name"]') ||
      meta('meta[name="application-name"]');

    const description =
      meta('meta[name="description"]') ||
      meta('meta[property="og:description"]') ||
      meta('meta[name="twitter:description"]');

    const title =
      meta('meta[property="og:title"]') ||
      meta('meta[name="twitter:title"]') ||
      document.title ||
      null;

    const lang = document.documentElement?.getAttribute('lang') || null;
    const dir = document.documentElement?.getAttribute('dir') || null;

    return {
      publishedTime,
      author,
      siteName,
      description,
      title,
      lang,
      dir,
    };
  }

  /**
   * Attempt to extract published time from schema.org JSON-LD scripts
   */
  extractJsonLdPublishedTime(document) {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        const text = script.textContent;
        if (!text) continue;
        const parsed = JSON.parse(text);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        if (item?.datePublished) return item.datePublished;
        if (item?.['@graph']) {
          const article = item['@graph'].find(
            (node) => node.datePublished || node['@type'] === 'Article' || node['@type'] === 'BlogPosting'
          );
          if (article?.datePublished) return article.datePublished;
        }
      }
    } catch {
      // JSON parse error in script tag, ignore
    }
    return null;
  }
}

export const cleanerService = new CleanerService();
