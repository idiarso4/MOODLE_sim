import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLog';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum requests per window

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }

  // Get or create rate limit info for this IP
  let rateLimit = requestCounts.get(ip);
  if (!rateLimit) {
    rateLimit = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
    requestCounts.set(ip, rateLimit);
  }

  // Check if limit exceeded
  if (rateLimit.count >= MAX_REQUESTS) {
    // Log rate limit exceeded
    auditLogService.createFromRequest(req, 'RATE_LIMIT_EXCEEDED', 'api');

    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
    });
  }

  // Increment request count
  rateLimit.count++;

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - rateLimit.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000));

  next();
}
