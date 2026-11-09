import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

// Reusable URL validator: must be valid URL and start with http:// or https://
const httpUrlSchema = z
  .string({ required_error: 'url is required' })
  .trim()
  .url({ message: 'Invalid URL format' })
  .refine(
    (url) => /^https?:\/\//i.test(url),
    { message: 'URL must use HTTP or HTTPS protocol' }
  );

// Options schema for extraction
const extractOptionsSchema = z.object({
  strip_links: z.boolean().default(false),
  include_html: z.boolean().default(false),
  cache: z.boolean().default(true),
  user_agent: z.string().optional(),
});

// POST /v1/extract body schema
export const postExtractSchema = z.object({
  url: httpUrlSchema,
  options: extractOptionsSchema.default({}),
});

// Helper to preprocess boolean query params (e.g. ?strip_links=true / ?strip_links=1)
const booleanQueryParam = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return undefined;
}, z.boolean().optional());

// GET /v1/extract query schema
export const getExtractSchema = z.object({
  url: httpUrlSchema,
  strip_links: booleanQueryParam.default(false),
  include_html: booleanQueryParam.default(false),
  cache: booleanQueryParam.default(true),
  user_agent: z.string().optional(),
}).transform((data) => ({
  url: data.url,
  options: {
    strip_links: data.strip_links ?? false,
    include_html: data.include_html ?? false,
    cache: data.cache ?? true,
    user_agent: data.user_agent,
  },
}));

// POST /v1/extract-and-chunk body schema (MarkRAG v2.0)
export const extractAndChunkSchema = z
  .object({
    url: z
      .string()
      .trim()
      .url({ message: 'Invalid URL format' })
      .refine((url) => /^https?:\/\//i.test(url), { message: 'URL must use HTTP or HTTPS protocol' })
      .optional(),
    html: z.string().optional(),
    options: z
      .object({
        chunkSizeTokens: z.coerce.number().int().min(16).max(4096).default(512),
        chunkOverlapTokens: z.coerce.number().int().min(0).max(500).default(50),
        includeLinks: z.boolean().default(true),
        includeImages: z.boolean().default(false),
        stripBoilerplate: z.boolean().default(true),
        strip_links: z.boolean().optional(),
      })
      .default({}),
  })
  .refine((data) => Boolean(data.url || (data.html && data.html.trim().length > 0)), {
    message: 'Either url or html must be provided',
    path: ['url'],
  });

/**
 * Middleware factory for validating request body or query with a Zod schema
 */
export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = source === 'query' ? req.query : req.body;
      const parsed = schema.parse(dataToValidate);
      req.validatedData = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        return next(new ValidationError('Request validation failed', details));
      }
      next(err);
    }
  };
}
