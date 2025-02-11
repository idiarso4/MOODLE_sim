import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getAuditLogs } from '../services/auditLog';

const router = Router();

// Get audit logs (admin only)
router.get('/', 
  authenticateToken,
  authorizeRoles(['ADMIN']),
  async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        resource: req.query.resource as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const logs = await getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
