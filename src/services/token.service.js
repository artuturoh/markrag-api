/**
 * Token and content estimation service for LLMs & Vector Databases
 */
export class TokenService {
  /**
   * Average characters per token across modern LLMs (OpenAI, Anthropic, Gemini) for English/code
   */
  static CHARS_PER_TOKEN = 4;

  /**
   * Average words per minute reading speed
   */
  static WORDS_PER_MINUTE = 200;

  /**
   * Estimates word count from text or markdown
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    // Strip markdown formatting symbols for accurate word count
    const cleaned = text
      .replace(/```[\s\S]*?```/g, ' ') // remove code blocks
      .replace(/[#*`_~\[\]()!<>|]/g, ' ') // remove markdown syntax
      .trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    return words.length;
  }

  /**
   * Estimates reading time in minutes
   */
  calculateReadingTime(wordCount) {
    if (wordCount <= 0) return 0;
    return Math.max(1, Math.ceil(wordCount / TokenService.WORDS_PER_MINUTE));
  }

  /**
   * Estimates token count based on the ~4 chars/token heuristic
   */
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    return Math.ceil(text.length / TokenService.CHARS_PER_TOKEN);
  }

  /**
   * Calculates comprehensive RAG token and efficiency metrics
   * @param {string} markdown Cleaned markdown content
   * @param {string} rawHtml Original downloaded raw HTML
   * @returns {Object} Metrics object
   */
  calculateMetrics(markdown, rawHtml = '') {
    const wordCount = this.countWords(markdown);
    const readingTimeMinutes = this.calculateReadingTime(wordCount);
    const characterCount = markdown ? markdown.length : 0;
    const estimatedTokens = this.estimateTokens(markdown);

    const rawHtmlCharacterCount = rawHtml ? rawHtml.length : 0;
    const rawHtmlEstimatedTokens = this.estimateTokens(rawHtml);

    const tokensSaved = Math.max(0, rawHtmlEstimatedTokens - estimatedTokens);
    const savingsPercentage =
      rawHtmlEstimatedTokens > 0
        ? Number((((rawHtmlEstimatedTokens - estimatedTokens) / rawHtmlEstimatedTokens) * 100).toFixed(1))
        : 0;

    return {
      wordCount,
      readingTimeMinutes,
      characterCount,
      estimatedTokens,
      rawHtmlCharacterCount,
      rawHtmlTokens: rawHtmlEstimatedTokens,
      tokensSaved,
      savingsPercentage,
    };
  }
}

export const tokenService = new TokenService();
