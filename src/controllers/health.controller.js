import { cacheService } from '../services/cache.service.js';

export class HealthController {
  check(req, res) {
    const memory = process.memoryUsage();

    res.status(200).json({
      status: 'ok',
      service: 'MarkRAG API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      },
      cache: {
        activeEntries: cacheService.size(),
      },
    });
  }
}

export const healthController = new HealthController();
