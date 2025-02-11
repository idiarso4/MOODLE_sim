import { Router, Request, Response } from 'express';
import { PrismaClient, AttendanceStatus } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { auditLogService } from '../services/auditLog';
import { validateLocation } from '../services/location';
import { uploadImage } from '../services/faceRecognition';
import { detectFaces } from '../services/faceRecognition';
import { notifyTeacher } from '../services/notification';
import { validateQRCode } from '../services/qrCode';

const router = Router();
const prisma = new PrismaClient();

// Define local enums since they are not exported from @prisma/client
enum AttendanceMethod {
  MANUAL,
  AUTOMATIC,
  FACE,
  QR_CODE
}

enum NotificationType {
  EMAIL,
  SMS,
  ATTENDANCE
}

interface Location {
  latitude: number;
  longitude: number;
}

interface AttendanceQuery {
  classId: string;
  startDate: string;
  endDate: string;
}

interface FaceAttendanceRequest {
  sessionId: string;
  image: string;
  location: Location;
}

interface QRAttendanceRequest {
  qrCode: string;
  location: Location;
}

interface AttendanceRecord {
  classId: string;
  startDate: string;
  endDate: string;
}

// Mark attendance using face recognition
router.post('/face', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId, image, location }: FaceAttendanceRequest = req.body;
    const userId: string = req.user.id;

    // Validate session is active
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { schedule: { include: { class: true } } }
    });

    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Invalid or inactive session' });
    }

    // Validate location
    if (!validateLocation(location, session.schedule.class)) {
      return res.status(400).json({ error: 'Location validation failed' });
    }

    // Process face recognition
    const imageUrl: string = await uploadImage(image);
    const faceMatched: boolean = await detectFaces(imageUrl, userId);

    if (!faceMatched) {
      return res.status(400).json({ error: 'Face recognition failed' });
    }

    // Record attendance
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        sessionId,
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.FACE,
        location,
        imageUrl
      }
    });

    // Notify teacher
    await notifyTeacher(session.schedule.class.teacherId, {
      type: NotificationType.ATTENDANCE,
      message: `${req.user.name} has marked attendance using face recognition`
    });

    res.json(attendance);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Face attendance error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.error('Face attendance error:', error);
    return res.status(400).json({ error: 'An unknown error occurred' });
  }
});

// Mark attendance using QR code
router.post('/qr', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { qrCode, location }: QRAttendanceRequest = req.body;
    const userId: string = req.user.id;

    // Validate QR code and get session
    const session = await validateQRCode(qrCode);
    if (!session) {
      return res.status(400).json({ error: 'Invalid QR code' });
    }

    // Validate location
    if (!validateLocation(location, session.schedule.class)) {
      return res.status(400).json({ error: 'Location validation failed' });
    }

    // Record attendance
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        sessionId: session.id,
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.QR_CODE,
        location
      }
    });

    // Notify teacher
    await notifyTeacher(session.schedule.class.teacherId, {
      type: NotificationType.ATTENDANCE,
      message: `${req.user.name} has marked attendance using QR code`
    });

    res.json(attendance);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('QR attendance error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.error('QR attendance error:', error);
    return res.status(400).json({ error: 'An unknown error occurred' });
  }
});

// Get attendance report
router.get('/report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const query: AttendanceQuery = req.query as unknown as AttendanceQuery;
    const { classId, startDate, endDate }: AttendanceQuery = query;
    
    // Validate parameters
    if (!classId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate user has access to class
    const hasAccess = await prisma.enrollment.findFirst({
      where: {
        classId: classId,
        userId: req.user.id
      }
    });

    if (!hasAccess && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get attendance records
    const attendances = await prisma.attendance.findMany({
      where: {
        session: {
          schedule: {
            classId: classId
          },
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
      }
    });

    // Generate report statistics
    const report = {
      totalSessions: await prisma.session.count({
        where: {
          schedule: {
            classId: classId
          },
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      }),
      attendances,
      statistics: {
        present: attendances.filter((a: AttendanceRecord) => a.status === AttendanceStatus.PRESENT).length,
        late: attendances.filter((a: AttendanceRecord) => a.status === AttendanceStatus.LATE).length,
        absent: attendances.filter((a: AttendanceRecord) => a.status === AttendanceStatus.ABSENT).length,
        excused: attendances.filter((a: AttendanceRecord) => a.status === AttendanceStatus.EXCUSED).length
      }
    };

    res.json(report);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Report generation error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.error('Report generation error:', error);
    return res.status(400).json({ error: 'An unknown error occurred' });
  }
});

// Get attendance records for a class
router.get('/class/:classId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: {
        session: {
          schedule: {
            classId
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
      present: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
      late: attendances.filter(a => a.status === AttendanceStatus.LATE).length,
      absent: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
      excused: attendances.filter(a => a.status === AttendanceStatus.EXCUSED).length
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

// Get attendance records for a student
router.get('/student/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { classId, startDate, endDate } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: studentId,
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
        session: {
          include: {
            schedule: true
          }
        }
      }
    });

    res.json(attendances);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Record attendance
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, status, method, location, imageUrl } = req.body;

    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        userId,
        status,
        method,
        location,
        imageUrl
      }
    });

    // Log attendance record
    await auditLogService.createFromRequest(
      req,
      'ATTENDANCE_RECORD',
      'attendance',
      {
        sessionId,
        userId,
        status,
        method
      }
    );

    res.json(attendance);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update attendance record
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, method, location, imageUrl } = req.body;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        method,
        location,
        imageUrl
      }
    });

    // Log attendance update
    await auditLogService.createFromRequest(
      req,
      'ATTENDANCE_UPDATE',
      'attendance',
      {
        id,
        status,
        method
      }
    );

    res.json(attendance);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export { router as attendanceRouter };
