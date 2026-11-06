import { Router } from 'express';
import healthRoutes from './health.routes.js';
import extractRoutes from './extract.routes.js';
import { rapidApiSecurityMiddleware } from '../middlewares/security.middleware.js';

const router = Router();

// Public health check route (for Render / UptimeRobot keep-alives)
router.use('/', healthRoutes);

// Protected API routes
router.use('/', rapidApiSecurityMiddleware, extractRoutes);

export default router;
