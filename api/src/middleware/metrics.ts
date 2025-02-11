import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();

  // Store original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Track response size
  let responseSize = 0;

  // Override json method to track response size
  res.json = function(body: any) {
    if (body) {
      responseSize = JSON.stringify(body).length;
    }
    return originalJson.apply(res, arguments as any);
  };

  // Override end method
  res.end = function(chunk?: any, encoding?: string, callback?: () => void) {
    const duration = performance.now() - start;

    // If chunk is provided, add to response size
    if (chunk) {
      responseSize += chunk.length;
    }

    // Log metrics
    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      responseSize: `${responseSize} bytes`,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    // Call original end
    return originalEnd.apply(res, [chunk, encoding, callback]);
  };

  next();
}
