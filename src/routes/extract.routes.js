import { Router } from 'express';
import { extractController } from '../controllers/extract.controller.js';
import {
  validateRequest,
  postExtractSchema,
  getExtractSchema,
} from '../middlewares/validation.middleware.js';

const router = Router();

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

export default router;
