import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { auditLogService } from '../services/auditLog';
import { exportToExcel } from '../services/export';

const router = Router();
const prisma = new PrismaClient();

// Get attendance report
router.get('/attendance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: {
        session: {
          schedule: {
            classId: classId as string
          },
          date: {
            gte: startDate ? new Date(startDate as string) : undefined,
            lte: endDate ? new Date(endDate as string) : undefined
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        session: {
          include: {
            schedule: true
          }
        }
      }
    });

    // Calculate statistics
    const stats = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'PRESENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      excused: attendances.filter(a => a.status === 'EXCUSED').length
    };

    res.json({ attendances, stats });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Export attendance report to Excel
router.get('/attendance/export', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: {
        session: {
          schedule: {
            classId: classId as string
          },
          date: {
            gte: startDate ? new Date(startDate as string) : undefined,
            lte: endDate ? new Date(endDate as string) : undefined
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        session: {
          include: {
            schedule: true
          }
        }
      }
    });

    const excelBuffer = await exportToExcel(attendances, 'Attendance Report');

    // Log export activity
    await auditLogService.createFromRequest(
      req,
      'EXPORT_REPORT',
      'attendance',
      {
        classId,
        startDate,
        endDate
      }
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router;
