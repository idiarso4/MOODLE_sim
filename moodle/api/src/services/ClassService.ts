import { PrismaClient, Class, User, Schedule } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

export class ClassService {
  async createClass(data: {
    name: string;
    teacherId: string;
    schedules?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  }): Promise<Class> {
    // Validate teacher exists
    const teacher = await prisma.user.findFirst({
      where: { id: data.teacherId, role: 'TEACHER' }
    });

    if (!teacher) {
      throw new ValidationError('Invalid teacher ID');
    }

    // Create class with schedules
    return await prisma.class.create({
      data: {
        name: data.name,
        teacherId: data.teacherId,
        schedule: {
          create: data.schedules
        }
      },
      include: {
        schedule: true,
        teacher: true
      }
    });
  }

  async updateClass(
    id: string,
    data: {
      name?: string;
      teacherId?: string;
    }
  ): Promise<Class> {
    // Verify class exists
    const existingClass = await prisma.class.findUnique({
      where: { id }
    });

    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // If changing teacher, validate new teacher
    if (data.teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { id: data.teacherId, role: 'TEACHER' }
      });

      if (!teacher) {
        throw new ValidationError('Invalid teacher ID');
      }
    }

    return await prisma.class.update({
      where: { id },
      data,
      include: {
        schedule: true,
        teacher: true
      }
    });
  }

  async deleteClass(id: string): Promise<void> {
    // Verify class exists
    const existingClass = await prisma.class.findUnique({
      where: { id }
    });

    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Delete class and related records
    await prisma.$transaction([
      prisma.attendance.deleteMany({
        where: {
          session: {
            schedule: {
              classId: id
            }
          }
        }
      }),
      prisma.session.deleteMany({
        where: {
          schedule: {
            classId: id
          }
        }
      }),
      prisma.schedule.deleteMany({
        where: { classId: id }
      }),
      prisma.enrollment.deleteMany({
        where: { classId: id }
      }),
      prisma.class.delete({
        where: { id }
      })
    ]);
  }

  async enrollStudents(classId: string, studentIds: string[]): Promise<void> {
    // Verify class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Verify all students exist and are students
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT'
      }
    });

    if (students.length !== studentIds.length) {
      throw new ValidationError('One or more invalid student IDs');
    }

    // Create enrollments
    await prisma.enrollment.createMany({
      data: studentIds.map(studentId => ({
        classId,
        userId: studentId
      })),
      skipDuplicates: true
    });
  }

  async getClassDetails(id: string): Promise<any> {
    const classDetails = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: true,
        schedule: {
          include: {
            sessions: {
              where: {
                date: {
                  gte: new Date()
                }
              }
            }
          }
        },
        enrollments: {
          include: {
            user: true
          }
        }
      }
    });

    if (!classDetails) {
      throw new NotFoundError('Class not found');
    }

    return classDetails;
  }
}
