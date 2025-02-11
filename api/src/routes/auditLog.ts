import { Router } from 'express';
import { auditLogService } from '../services/auditLog';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId, action, resource, startDate, endDate, page, limit } = req.query;

    const filters = {
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const result = await auditLogService.getLogs(filters);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router;
