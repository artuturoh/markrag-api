import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * Static client JavaScript for the Interactive Live RAG Studio
 * Served with explicit Content-Type header and charset
 */
router.get('/studio.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  const primaryPath = path.resolve('public', 'studio.js');
  const fallbackPath = path.resolve('src', 'public', 'studio.js');
  const targetPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;
  return res.sendFile(targetPath);
});

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
    version: '2.0.0',
    description: 'Intelligent RAG Knowledge Preprocessor, Semantic Chunker & Web-to-Markdown Engine',
    status: 'online',
    endpoints: {
      extractAndChunk: 'POST /v1/extract-and-chunk',
      extractPost: 'POST /v1/extract',
      extractGet: 'GET /v1/extract?url={url}',
      demo: 'POST /v1/demo',
      health: 'GET /health',
    },
    rapidApi: 'https://rapidapi.com/artuturoh/api/markrag-web-to-clean-markdown-and-rag-parser',
  });
});

export default router;
