import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { generatePDF } from '../services/pdf';
import { exportToExcel } from '../services/excel';

interface AttendanceQuery {
  classId: string;
  startDate: string;
  endDate: string;
  format: string;
}

interface StudentQuery {
  userId: string;
  classId: string;
  month: string;
}

interface ReportGenerationOptions {
  attendances: any[];
  stats: any;
}

const router = Router();
const prisma = new PrismaClient();

// Get detailed attendance report
router.get('/attendance/:classId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, format }: AttendanceQuery = req.query as unknown as AttendanceQuery;

    // Verify access
    const hasAccess = await prisma.class.findFirst({
      where: {
        id: classId,
        OR: [
          { teacherId: req.user!.id },
          { enrollments: { some: { userId: req.user!.id } } }
        ]
      }
    });

    if (!hasAccess && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get attendance data
    const attendances = await prisma.attendance.findMany({
      where: {
        session: {
          schedule: { classId },
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      },
      include: {
        user: true,
        session: {
          include: {
            schedule: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const stats = {
      total: attendances.length,
      byStatus: {
        PRESENT: attendances.filter(a => a.status === 'PRESENT').length,
        LATE: attendances.filter(a => a.status === 'LATE').length,
        ABSENT: attendances.filter(a => a.status === 'ABSENT').length,
        EXCUSED: attendances.filter(a => a.status === 'EXCUSED').length
      },
      byMethod: {
        FACE: attendances.filter(a => a.method === 'FACE').length,
        QR_CODE: attendances.filter(a => a.method === 'QR_CODE').length,
        MANUAL: attendances.filter(a => a.method === 'MANUAL').length
      }
    };

    // Format response based on request
    if (format === 'pdf') {
      const pdfBuffer = await generatePDF({ attendances, stats } as ReportGenerationOptions);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
      return res.send(pdfBuffer);
    }

    if (format === 'excel') {
      const excelBuffer = await exportToExcel({ attendances, stats } as ReportGenerationOptions);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
      return res.send(excelBuffer);
    }

    res.json({ attendances, stats });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Report generation error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unknown error occurred' });
  }
});

// Get student attendance summary
router.get('/student/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { classId, month }: StudentQuery = req.query as unknown as StudentQuery;

    // Verify access
    if (userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      const isTeacher = await prisma.class.findFirst({
        where: {
          id: classId as string,
          teacherId: req.user!.id
        }
      });

      if (!isTeacher) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get attendance summary
    const startDate = new Date(month as string);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId,
        session: {
          schedule: classId ? { classId: classId as string } : undefined,
          date: {
            gte: startDate,
            lt: endDate
          }
        }
      },
      include: {
        session: {
          include: {
            schedule: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });

    // Calculate statistics
    const summary = {
      totalSessions: await prisma.session.count({
        where: {
          schedule: classId ? { classId: classId as string } : undefined,
          date: {
            gte: startDate,
            lt: endDate
          }
        }
      }),
      attended: attendances.filter(a => a.status === 'PRESENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      excused: attendances.filter(a => a.status === 'EXCUSED').length,
      attendanceRate: 0
    };

    summary.attendanceRate = (summary.attended + summary.late) / summary.totalSessions * 100;

    res.json({ summary, attendances });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Student report error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unknown error occurred' });
  }
});

export default router;
