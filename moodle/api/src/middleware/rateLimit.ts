import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const rateLimit = new Map<string, RateLimitRecord>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export function rateLimiter(
    req: Request, 
    res: Response, 
    next: NextFunction
): Response | void {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimit.get(ip);

    if (!record) {
        rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return next();
    }

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + WINDOW_MS;
        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil((record.resetTime - now) / 1000) // seconds until reset
        });
    }

    record.count++;
    return next();
}
