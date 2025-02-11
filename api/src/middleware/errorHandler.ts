import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user
    });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // Prisma error handling
    if (err.name === 'PrismaClientKnownRequestError') {
        if ((err as any).code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: 'Duplicate entry found'
            });
        }
    }

    // Default error
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};
