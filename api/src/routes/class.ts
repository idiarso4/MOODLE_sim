import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ClassService } from '../services/ClassService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const classService = new ClassService();

// Create new class
router.post('/', 
    authenticateToken,
    authorizeRoles(['ADMIN', 'TEACHER']),
    async (req: Request, res: Response) => {
        try {
            const classData = await classService.createClass(req.body);
            return res.status(201).json(classData);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
);

// Update class
router.put('/:id',
    authenticateToken,
    authorizeRoles(['ADMIN', 'TEACHER']),
    async (req: Request, res: Response) => {
        try {
            const classData = await classService.updateClass(req.params.id, req.body);
            return res.json(classData);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
);

// Delete class
router.delete('/:id',
    authenticateToken,
    authorizeRoles(['ADMIN']),
    async (req: Request, res: Response) => {
        try {
            await classService.deleteClass(req.params.id);
            return res.status(204).send();
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
);

// Enroll students
router.post('/:id/enroll',
    authenticateToken,
    authorizeRoles(['ADMIN', 'TEACHER']),
    async (req: Request, res: Response) => {
        try {
            await classService.enrollStudents(req.params.id, req.body.studentIds);
            return res.status(201).send();
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
);

// Get class details
router.get('/:id',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const classDetails = await classService.getClassDetails(req.params.id);
            return res.json(classDetails);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
);

export default router;
