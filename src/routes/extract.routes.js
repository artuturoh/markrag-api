import { Router } from 'express';
import { extractController } from '../controllers/extract.controller.js';
import { chunkController } from '../controllers/chunk.controller.js';
import {
  validateRequest,
  postExtractSchema,
  getExtractSchema,
  extractAndChunkSchema,
} from '../middlewares/validation.middleware.js';
import { demoRateLimiter } from '../middleware/rapidapiAuth.js';

const router = Router();

// ==========================================
// V1 Core Extraction Endpoints (Backward Compatible)
// ==========================================

// POST /v1/extract - Standard JSON payload
router.post(
  '/v1/extract',
  validateRequest(postExtractSchema, 'body'),
  (req, res, next) => extractController.extract(req, res, next)
);

// GET /v1/extract - Quick query parameter extraction
router.get(
  '/v1/extract',
  validateRequest(getExtractSchema, 'query'),
  (req, res, next) => extractController.extract(req, res, next)
);

// POST /v1/parse - Alias for backward compatibility
router.post(
  '/v1/parse',
  validateRequest(postExtractSchema, 'body'),
  (req, res, next) => extractController.extract(req, res, next)
);

// ==========================================
// V2 Flagship: Extract and Semantic Chunk
// ==========================================

// POST /v1/extract-and-chunk - Flagship intelligent RAG preprocessor
router.post(
  '/v1/extract-and-chunk',
  validateRequest(extractAndChunkSchema, 'body'),
  (req, res, next) => chunkController.extractAndChunk(req, res, next)
);

// POST /extract-and-chunk - Route alias
router.post(
  '/extract-and-chunk',
  validateRequest(extractAndChunkSchema, 'body'),
  (req, res, next) => chunkController.extractAndChunk(req, res, next)
);

// POST /v1/demo - Rate-limited studio demo endpoint (exempt from RapidAPI proxy secret)
router.post(
  '/v1/demo',
  demoRateLimiter,
  validateRequest(extractAndChunkSchema, 'body'),
  (req, res, next) => chunkController.extractAndChunk(req, res, next)
);

export default router;
