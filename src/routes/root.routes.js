import { Router } from 'express';
import path from 'path';

const router = Router();

/**
 * Root endpoint GET /
 * - Returns modern dark-mode landing page if client accepts HTML
 * - Returns JSON service descriptor if client requests Accept: application/json
 */
router.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.resolve('public', 'index.html'));
  }

  return res.status(200).json({
    service: 'MarkRAG API',
    version: '1.0.0',
    description: 'Web to Clean Markdown & RAG Parser for AI Agents and Vector Databases',
    status: 'online',
    endpoints: {
      extractPost: 'POST /v1/extract',
      extractGet: 'GET /v1/extract?url={url}',
      health: 'GET /health',
    },
    rapidApi: 'https://rapidapi.com/artuturoh/api/markrag-web-to-clean-markdown-and-rag-parser',
  });
});

export default router;
