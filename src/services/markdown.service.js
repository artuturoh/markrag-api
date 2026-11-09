import TurndownService from 'turndown';
import * as gfmPlugin from 'turndown-plugin-gfm';

const { gfm } = gfmPlugin;

export class MarkdownService {
  constructor() {
    this.services = new Map();
  }

  /**
   * Instantiates a TurndownService instance configured with GFM and formatting rules
   */
  createTurndownService({ stripLinks = false, includeImages = true } = {}) {
    const key = `${stripLinks}:${includeImages}`;
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    const service = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    });

    // Apply GitHub Flavored Markdown plugin (tables, strikethrough, task lists)
    service.use(gfm);

    // Rule: Fenced code blocks with programming language extraction
    service.addRule('fencedCodeBlockWithLang', {
      filter: (node, options) => {
        return (
          options.codeBlockStyle === 'fenced' &&
          node.nodeName === 'PRE' &&
          node.firstChild &&
          node.firstChild.nodeName === 'CODE'
        );
      },
      replacement: (content, node) => {
        const codeNode = node.firstChild;
        const className = codeNode.getAttribute('class') || '';
        const match = className.match(/(?:lang|language)-(\S+)/);
        const language = match ? match[1] : '';
        const codeText = codeNode.textContent || '';
        return `\n\n\`\`\`${language}\n${codeText.replace(/\n+$/, '')}\n\`\`\`\n\n`;
      },
    });

    // Rule: Strip links to save tokens if requested
    if (stripLinks) {
      service.addRule('stripLinks', {
        filter: 'a',
        replacement: (content) => content.trim(),
      });
    }

    // Rule: Strip images if not included
    if (!includeImages) {
      service.addRule('stripImages', {
        filter: 'img',
        replacement: () => '',
      });
    }

    this.services.set(key, service);
    return service;
  }

  /**
   * Converts HTML string to clean Markdown
   * @param {string} html Clean HTML from Readability
   * @param {Object} [options]
   * @param {boolean} [options.strip_links=false]
   * @param {boolean} [options.includeLinks=true]
   * @param {boolean} [options.includeImages=true]
   * @returns {string} Clean Markdown
   */
  convertToMarkdown(html, options = {}) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const stripLinks = Boolean(
      options.strip_links === true || options.includeLinks === false
    );
    const includeImages = options.includeImages !== false;

    const service = this.createTurndownService({ stripLinks, includeImages });

    let markdown = service.turndown(html);

    // Post-processing cleanup
    return this.postProcess(markdown);
  }

  /**
   * Cleans up redundant newlines, spaces, and formatting quirks
   */
  postProcess(markdown) {
    return markdown
      // Fix Turndown escaping of leading headings and blockquotes
      .replace(/^\\([#>])/gm, '$1')
      // Normalize list item indentations: "-   item" -> "- item"
      .replace(/^([\s]*[-*+])\s{2,}/gm, '$1 ')
      // Remove trailing whitespace on each line
      .replace(/[ \t]+$/gm, '')
      // Collapse 3 or more consecutive newlines into 2
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const markdownService = new MarkdownService();
