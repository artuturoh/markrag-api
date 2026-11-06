import { Router } from 'express';
import rootRoutes from './root.routes.js';
import healthRoutes from './health.routes.js';
import extractRoutes from './extract.routes.js';
import { rapidApiSecurityMiddleware } from '../middlewares/security.middleware.js';

const router = Router();

// Public routes (Root landing page & Health check)
router.use('/', rootRoutes);
router.use('/', healthRoutes);

// Protected API routes
router.use('/', rapidApiSecurityMiddleware, extractRoutes);

export default router;
