import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { register, Histogram } from 'prom-client';

// Create metrics
const httpRequestDurationMicroseconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10]
});

// Initialize metrics
register.setDefaultLabels({
    app: 'attendance-api'
});

export const metricsMiddleware = async (req: Request, res: Response): Promise<void> => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).end(errorMessage);
    }
};

export const performanceMonitor = (
    req: Request, 
    res: Response, 
    next: NextFunction
): void => {
    const start = performance.now();
    const { method, path } = req;

    // Record response metrics
    res.on('finish', () => {
        const duration = performance.now() - start;
        const statusCode = res.statusCode.toString();

        // Log request details
        logger.info(`${method} ${path} ${statusCode} ${duration.toFixed(2)}ms`);

        // Record metrics
        httpRequestDurationMicroseconds
            .labels(method, path, statusCode)
            .observe(duration / 1000); // Convert to seconds
    });

    next();
};

interface MemoryUsage {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
}

// Memory usage monitoring
export const memoryMonitor = (): NodeJS.Timer => {
    return setInterval(() => {
        const used = process.memoryUsage();
        const memoryStats: MemoryUsage = {
            rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(used.external / 1024 / 1024)}MB`
        };
        logger.info('Memory Usage:', memoryStats);
    }, 300000); // Every 5 minutes
};
