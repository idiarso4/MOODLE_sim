import { ClassService } from '../../src/services/ClassService';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../src/utils/errors';

jest.mock('@prisma/client');

describe('ClassService', () => {
    let classService: ClassService;
    let prisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        prisma = {
            class: {
                create: jest.fn(),
                update: jest.fn(),
                findUnique: jest.fn(),
                delete: jest.fn()
            },
            user: {
                findFirst: jest.fn()
            },
            enrollment: {
                createMany: jest.fn()
            }
        } as any;
        classService = new ClassService();
    });

    describe('createClass', () => {
        const validClassData = {
            name: 'Test Class',
            teacherId: '1',
            schedules: [
                {
                    dayOfWeek: 1,
                    startTime: '09:00',
                    endTime: '10:30'
                }
            ]
        };

        it('should create a class successfully', async () => {
            prisma.user.findFirst.mockResolvedValue({
                id: '1',
                role: 'TEACHER',
                name: 'Test Teacher'
            });

            prisma.class.create.mockResolvedValue({
                ...validClassData,
                id: '1',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await classService.createClass(validClassData);

            expect(result).toBeDefined();
            expect(result.name).toBe(validClassData.name);
            expect(prisma.class.create).toHaveBeenCalled();
        });

        it('should throw ValidationError for invalid teacher', async () => {
            prisma.user.findFirst.mockResolvedValue(null);

            await expect(classService.createClass(validClassData))
                .rejects
                .toThrow(ValidationError);
        });
    });

    describe('enrollStudents', () => {
        const classId = '1';
        const studentIds = ['1', '2', '3'];

        it('should enroll students successfully', async () => {
            prisma.class.findUnique.mockResolvedValue({
                id: classId,
                name: 'Test Class'
            });

            prisma.user.findMany.mockResolvedValue(
                studentIds.map(id => ({
                    id,
                    role: 'STUDENT',
                    name: `Student ${id}`
                }))
            );

            await classService.enrollStudents(classId, studentIds);

            expect(prisma.enrollment.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining(
                    studentIds.map(studentId => ({
                        classId,
                        userId: studentId
                    }))
                ),
                skipDuplicates: true
            });
        });

        it('should throw NotFoundError for invalid class', async () => {
            prisma.class.findUnique.mockResolvedValue(null);

            await expect(classService.enrollStudents(classId, studentIds))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw ValidationError for invalid students', async () => {
            prisma.class.findUnique.mockResolvedValue({
                id: classId,
                name: 'Test Class'
            });

            prisma.user.findMany.mockResolvedValue([]);

            await expect(classService.enrollStudents(classId, studentIds))
                .rejects
                .toThrow(ValidationError);
        });
    });
});
