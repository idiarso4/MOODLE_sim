import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { auditLogService } from '../services/auditLog';

const router = Router();
const prisma = new PrismaClient();

// Get schedules for a class
router.get('/class/:classId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const schedules = await prisma.schedule.findMany({
      where: {
        classId
      },
      include: {
        class: true,
        sessions: {
          include: {
            attendances: true
          }
        }
      }
    });

    res.json(schedules);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Create a new schedule
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId, dayOfWeek, startTime, endTime, room } = req.body;

    const schedule = await prisma.schedule.create({
      data: {
        classId,
        dayOfWeek,
        startTime,
        endTime,
        room
      }
    });

    // Log schedule creation
    await auditLogService.createFromRequest(
      req,
      'CREATE_SCHEDULE',
      'schedule',
      {
        classId,
        dayOfWeek,
        startTime,
        endTime,
        room
      }
    );

    res.json(schedule);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update a schedule
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, room } = req.body;

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        dayOfWeek,
        startTime,
        endTime,
        room
      }
    });

    // Log schedule update
    await auditLogService.createFromRequest(
      req,
      'UPDATE_SCHEDULE',
      'schedule',
      {
        id,
        dayOfWeek,
        startTime,
        endTime,
        room
      }
    );

    res.json(schedule);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Delete a schedule
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.delete({
      where: { id }
    });

    // Log schedule deletion
    await auditLogService.createFromRequest(
      req,
      'DELETE_SCHEDULE',
      'schedule',
      { id }
    );

    res.json(schedule);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router;
