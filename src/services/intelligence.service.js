/**
 * Content Intelligence Service for MarkRAG v2.0
 * Computes cleaning metrics, metadata intelligence, and RAG quality diagnostics.
 */
export class IntelligenceService {
  /**
   * Analyzes raw HTML DOM and extracts element counts and metadata intelligence
   * @param {Document} document - JSDOM Document
   * @param {string} rawHtml - Original raw HTML string
   * @param {string} targetUrl - Target or canonical URL
   * @param {Object} readabilityArticle - Parsed article from Readability
   * @param {string} cleanMarkdown - Output Markdown
   */
  analyze({ document, rawHtml, targetUrl, readabilityArticle, cleanMarkdown }) {
    const rawHtmlBytes = Buffer.byteLength(rawHtml || '', 'utf8');
    const cleanMarkdownBytes = Buffer.byteLength(cleanMarkdown || '', 'utf8');

    const rawEstimatedTokens = Math.ceil((rawHtml || '').length / 4);
    const cleanEstimatedTokens = Math.ceil((cleanMarkdown || '').length / 4);
    const tokensSaved = Math.max(0, rawEstimatedTokens - cleanEstimatedTokens);
    const compressionRatioPercentage =
      rawEstimatedTokens > 0
        ? Number((((rawEstimatedTokens - cleanEstimatedTokens) / rawEstimatedTokens) * 100).toFixed(1))
        : 0;

    // 1. Noise element counts
    const removedElements = this.countNoiseElements(document);

    // 2. Metadata Intelligence
    const metadata = this.extractMetadata(document, targetUrl, readabilityArticle);

    // 3. Quality Diagnostics
    const qualityDiagnostics = this.evaluateQuality({
      rawHtml,
      cleanMarkdown,
      readabilityArticle,
      document,
    });

    const cleaningStats = {
      rawHtmlBytes,
      cleanMarkdownBytes,
      rawEstimatedTokens,
      cleanEstimatedTokens,
      tokensSaved,
      compressionRatioPercentage,
      removedElements,
    };

    return {
      metadata,
      cleaningStats,
      tokenMetrics: cleaningStats, // Provided under both keys for maximum developer convenience
      qualityDiagnostics,
    };
  }

  /**
   * Counts boilerplate and tracking elements in the DOM
   */
  countNoiseElements(document) {
    if (!document) {
      return {
        scripts: 0,
        styles: 0,
        navs: 0,
        footers: 0,
        adsAndTrackers: 0,
        svgs: 0,
        hiddenNodes: 0,
      };
    }

    const count = (selector) => {
      try {
        return document.querySelectorAll(selector).length;
      } catch {
        return 0;
      }
    };

    const scripts = count('script');
    const styles = count('style') + count('link[rel="stylesheet"]');
    const navs = count('nav, [role="navigation"], header nav');
    const footers = count('footer, [role="contentinfo"]');
    const svgs = count('svg');
    const hiddenNodes = count('[hidden], [aria-hidden="true"], [style*="display: none"], [style*="display:none"]');
    const adsAndTrackers = count(
      '[class*="ad-"], [class*="advertisement"], [id*="ad-"], [class*="sponsor"], iframe[src*="doubleclick"], [class*="cookie"], [id*="cookie"], [class*="banner"]'
    );

    return {
      scripts,
      styles,
      navs,
      footers,
      adsAndTrackers,
      svgs,
      hiddenNodes,
    };
  }

  /**
   * Extracts rich metadata, citation, and links summary
   */
  extractMetadata(document, targetUrl, readabilityArticle) {
    const meta = (selector, attr = 'content') => {
      const el = document?.querySelector?.(selector);
      return el ? el.getAttribute(attr) : null;
    };

    let domain = 'example.com';
    try {
      if (targetUrl) {
        domain = new URL(targetUrl).hostname;
      }
    } catch {
      // ignore
    }

    const canonicalUrl =
      meta('link[rel="canonical"]', 'href') ||
      meta('meta[property="og:url"]') ||
      targetUrl ||
      'https://example.com/article';

    const title =
      meta('meta[property="og:title"]') ||
      meta('meta[name="twitter:title"]') ||
      readabilityArticle?.title ||
      document?.title ||
      'Untitled Document';

    const description =
      meta('meta[name="description"]') ||
      meta('meta[property="og:description"]') ||
      meta('meta[name="twitter:description"]') ||
      readabilityArticle?.excerpt ||
      null;

    const author =
      readabilityArticle?.byline ||
      meta('meta[name="author"]') ||
      meta('meta[property="article:author"]') ||
      meta('meta[name="twitter:creator"]') ||
      null;

    const publishedDate =
      meta('meta[property="article:published_time"]') ||
      meta('meta[name="publication_date"]') ||
      meta('meta[name="date"]') ||
      meta('meta[property="og:published_time"]') ||
      document?.querySelector?.('time[datetime]')?.getAttribute('datetime') ||
      null;

    const modifiedDate =
      meta('meta[property="article:modified_time"]') ||
      meta('meta[property="og:updated_time"]') ||
      null;

    const language =
      document?.documentElement?.getAttribute('lang') ||
      meta('meta[http-equiv="content-language"]') ||
      null;

    const siteName =
      meta('meta[property="og:site_name"]') ||
      meta('meta[name="application-name"]') ||
      readabilityArticle?.siteName ||
      domain;

    // Determine contentType
    let contentType = 'article';
    const ogType = meta('meta[property="og:type"]');
    if (ogType) {
      contentType = ogType;
    } else if (targetUrl && (targetUrl.includes('/docs') || targetUrl.includes('/documentation') || targetUrl.includes('/api/'))) {
      contentType = 'documentation';
    } else if (targetUrl && targetUrl.includes('/blog/')) {
      contentType = 'blog';
    }

    // Citation builder
    const citationDate = publishedDate ? ` (${publishedDate.slice(0, 10)})` : '';
    const citation = {
      markdown: `[${title}](${canonicalUrl})`,
      text: `${title} - ${siteName}${citationDate}`,
    };

    // Links summary
    const linksSummary = this.summarizeLinks(document, domain);

    return {
      title,
      description,
      author,
      publishedDate,
      modifiedDate,
      canonicalUrl,
      language,
      siteName,
      domain,
      contentType,
      citation,
      linksSummary,
    };
  }

  /**
   * Classifies internal vs external links
   */
  summarizeLinks(document, hostDomain) {
    if (!document) {
      return { internalCount: 0, externalCount: 0, sampleLinks: [] };
    }

    const anchorEls = Array.from(document.querySelectorAll('a[href]'));
    let internalCount = 0;
    let externalCount = 0;
    const sampleLinks = [];

    for (const a of anchorEls) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

      try {
        const parsed = new URL(href, `https://${hostDomain}`);
        const isInternal = parsed.hostname === hostDomain || !href.startsWith('http');
        if (isInternal) {
          internalCount++;
        } else {
          externalCount++;
        }
        if (sampleLinks.length < 5 && !sampleLinks.includes(parsed.href)) {
          sampleLinks.push(parsed.href);
        }
      } catch {
        // ignore invalid urls
      }
    }

    return {
      internalCount,
      externalCount,
      sampleLinks,
    };
  }

  /**
   * Evaluates quality diagnostics and RAG readiness score (0-100)
   */
  evaluateQuality({ rawHtml = '', cleanMarkdown = '', readabilityArticle, document }) {
    const warnings = [];
    const flags = {
      isEmptyOrThinContent: false,
      requiresJavaScriptSpaShell: false,
      possiblePaywallOrLoginWall: false,
      hasStructuredHeadings: false,
    };

    const text = (cleanMarkdown || readabilityArticle?.textContent || '').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 1. Check for thin content
    if (wordCount < 100) {
      flags.isEmptyOrThinContent = true;
      warnings.push(`Low word count (${wordCount} words); content may be thin, a stub, or paywalled.`);
    }

    // 2. Check for JS SPA Shell
    const rawLower = rawHtml.toLowerCase();
    const hasSpaRoot =
      rawLower.includes('id="root"') ||
      rawLower.includes('id="app"') ||
      rawLower.includes('id="__next"');
    const hasJsNotice =
      rawLower.includes('enable javascript to run this app') ||
      rawLower.includes('you need to enable javascript') ||
      rawLower.includes('javascript is required to view this site');

    if (hasJsNotice || (hasSpaRoot && wordCount < 120)) {
      flags.requiresJavaScriptSpaShell = true;
      warnings.push('Page appears to require client-side JavaScript hydration (SPA shell detected).');
    }

    // 3. Check for Paywall / Login Wall
    const hasPaywallKeyword =
      rawLower.includes('subscribe to continue reading') ||
      rawLower.includes('sign in to read the full story') ||
      rawLower.includes('already a subscriber? log in') ||
      rawLower.includes('this article is for subscribers only') ||
      rawLower.includes('premium subscription required');

    if (hasPaywallKeyword) {
      flags.possiblePaywallOrLoginWall = true;
      warnings.push('Possible paywall, subscription gate, or login wall detected.');
    }

    // 4. Structured Headings
    const hasHeadings = /(^|\n)#{1,6}\s+/m.test(cleanMarkdown);
    flags.hasStructuredHeadings = hasHeadings;
    if (!hasHeadings && wordCount > 80) {
      warnings.push('Document lacks structured Markdown headings (H1-H3).');
    }

    // Calculate RAG readiness score (0 - 100)
    let score = 100;
    if (flags.requiresJavaScriptSpaShell) score -= 50;
    if (flags.possiblePaywallOrLoginWall) score -= 35;
    if (flags.isEmptyOrThinContent) score -= 30;
    if (!flags.hasStructuredHeadings) score -= 15;

    // Bonus for high quality structured longform articles
    if (wordCount > 300 && flags.hasStructuredHeadings && !flags.possiblePaywallOrLoginWall) {
      score = Math.min(100, score + 10);
    }

    score = Math.max(0, Math.min(100, score));

    let status = 'optimal';
    if (score < 50) {
      status = 'poor';
    } else if (score < 75) {
      status = 'warning';
    }

    return {
      ragReadinessScore: score,
      status,
      flags,
      warnings,
    };
  }
}

export const intelligenceService = new IntelligenceService();
