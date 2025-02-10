import { Router } from 'express';
import { ScheduleService } from '../services/ScheduleService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const scheduleService = new ScheduleService();

// Create schedule
router.post('/',
    authenticateToken,
    authorizeRoles(['ADMIN', 'TEACHER']),
    async (req, res) => {
        try {
            const schedule = await scheduleService.createSchedule(req.body);
            res.status(201).json(schedule);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Generate sessions
router.post('/:id/sessions',
    authenticateToken,
    authorizeRoles(['ADMIN', 'TEACHER']),
    async (req, res) => {
        try {
            const { startDate, endDate } = req.body;
            const sessions = await scheduleService.generateSessions(
                req.params.id,
                new Date(startDate),
                new Date(endDate)
            );
            res.status(201).json(sessions);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Update schedule
router.put('/:id',
    authenticateToken,
    authorizeRoles(['ADMIN', 'TEACHER']),
    async (req, res) => {
        try {
            const schedule = await scheduleService.updateSchedule(
                req.params.id,
                req.body
            );
            res.json(schedule);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

export default router;
