import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

describe('Attendance API', () => {
    let authToken: string;
    let classId: string;
    let sessionId: string;

    beforeAll(async () => {
        // Setup test database
        await prisma.$transaction([
            prisma.attendance.deleteMany(),
            prisma.session.deleteMany(),
            prisma.schedule.deleteMany(),
            prisma.enrollment.deleteMany(),
            prisma.class.deleteMany(),
            prisma.user.deleteMany()
        ]);

        // Create test user
        const teacher = await prisma.user.create({
            data: {
                email: 'teacher@example.com',
                name: 'Test Teacher',
                password: await hash('password123', 10),
                role: 'TEACHER'
            }
        });

        // Login
        const response = await request(app)
            .post('/api/user/login')
            .send({
                email: 'teacher@example.com',
                password: 'password123'
            });
        authToken = response.body.token;

        // Create test class
        const classData = await prisma.class.create({
            data: {
                name: 'Test Class',
                teacherId: teacher.id,
                schedule: {
                    create: {
                        dayOfWeek: 1,
                        startTime: '09:00',
                        endTime: '10:30',
                        sessions: {
                            create: {
                                date: new Date(),
                                status: 'ACTIVE'
                            }
                        }
                    }
                }
            },
            include: {
                schedule: {
                    include: {
                        sessions: true
                    }
                }
            }
        });

        classId = classData.id;
        sessionId = classData.schedule[0].sessions[0].id;
    });

    afterAll(async () => {
        await prisma.$transaction([
            prisma.attendance.deleteMany(),
            prisma.session.deleteMany(),
            prisma.schedule.deleteMany(),
            prisma.enrollment.deleteMany(),
            prisma.class.deleteMany(),
            prisma.user.deleteMany()
        ]);
        await prisma.$disconnect();
    });

    describe('POST /api/attendance/face', () => {
        it('should mark attendance with face recognition', async () => {
            const response = await request(app)
                .post('/api/attendance/face')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    sessionId,
                    image: 'base64_encoded_image',
                    location: {
                        lat: 0,
                        lng: 0
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.method).toBe('FACE');
        });

        it('should reject invalid session', async () => {
            const response = await request(app)
                .post('/api/attendance/face')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    sessionId: 'invalid_session_id',
                    image: 'base64_encoded_image',
                    location: {
                        lat: 0,
                        lng: 0
                    }
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/attendance/report', () => {
        it('should get attendance report', async () => {
            const response = await request(app)
                .get('/api/attendance/report')
                .set('Authorization', `Bearer ${authToken}`)
                .query({
                    classId,
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString()
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalSessions');
            expect(response.body).toHaveProperty('attendances');
        });
    });
});
