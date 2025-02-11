import { Request, Response, NextFunction } from 'express';
import { 
  httpRequestDurationMicroseconds, 
  totalRequests, 
  apiErrors 
} from '../services/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Start timer
  const start = process.hrtime();

  // Record original end function
  const originalEnd = res.end;

  // Override end function
  res.end = function(...args: any[]) {
    // Calculate duration
    const dur = process.hrtime(start);
    const duration = dur[0] + dur[1] / 1e9;

    // Get route from originalUrl, fallback to path if not available
    const route = req.route ? req.route.path : req.originalUrl;

    // Increment total requests counter
    totalRequests.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    // Observe request duration
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration
    );

    // If error occurred (status >= 400)
    if (res.statusCode >= 400) {
      apiErrors.inc({
        route,
        error_type: res.statusCode >= 500 ? 'server_error' : 'client_error'
      });
    }

    originalEnd.apply(res, args);
  };

  next();
};
