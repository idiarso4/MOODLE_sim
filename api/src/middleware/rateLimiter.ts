import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { createAuditLog } from '../services/auditLog';

// Base rate limiter configuration
const createLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  resource: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      // Log rate limit exceeded
      createAuditLog(req, 'RATE_LIMIT_EXCEEDED', options.resource, {
        ip: req.ip,
        path: req.path
      });
      
      res.status(429).json({ 
        error: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// General API rate limit
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  resource: 'API'
});

// Authentication rate limit
export const authLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login attempts per hour
  message: 'Too many login attempts from this IP, please try again later',
  resource: 'AUTH'
});

// Face recognition rate limit
export const faceRecognitionLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 face recognition attempts per minute
  message: 'Too many face recognition attempts, please try again later',
  resource: 'FACE_RECOGNITION'
});

// QR Code rate limit
export const qrCodeLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 QR code scans per minute
  message: 'Too many QR code scans, please try again later',
  resource: 'QR_CODE'
});

// Export rate limit
export const exportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 exports per hour
  message: 'Export limit reached, please try again later',
  resource: 'EXPORT'
});
