import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError as JoiValidationError } from 'joi';
import { ValidationError } from '../utils/errors';

export const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { error } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errorMessage = error.details
                    .map(detail => detail.message)
                    .join(', ');
                throw new ValidationError(errorMessage);
            }

            next();
        } catch (err) {
            if (err instanceof ValidationError) {
                next(err);
            } else if (err instanceof JoiValidationError) {
                next(new ValidationError(err.message));
            } else {
                next(new Error('Validation failed'));
            }
        }
    };
};
