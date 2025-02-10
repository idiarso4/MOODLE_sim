import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

describe('Authentication API', () => {
    beforeAll(async () => {
        // Setup test database
        await prisma.user.deleteMany();
        
        // Create test user
        await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                password: await hash('password123', 10),
                role: 'TEACHER'
            }
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });

    describe('POST /api/user/login', () => {
        it('should authenticate valid credentials', async () => {
            const response = await request(app)
                .post('/api/user/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/user/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Protected Routes', () => {
        let authToken: string;

        beforeAll(async () => {
            const response = await request(app)
                .post('/api/user/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            authToken = response.body.token;
        });

        it('should access protected route with valid token', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });

        it('should reject access without token', async () => {
            const response = await request(app)
                .get('/api/user/profile');

            expect(response.status).toBe(401);
        });
    });
});
