import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Attendance Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    authToken = sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('POST /attendance/face', () => {
    it('should record attendance with valid face image', async () => {
      const testImage = fs.readFileSync(
        path.join(__dirname, '../test-data/test-face.jpg'),
        { encoding: 'base64' }
      );

      const response = await request(app)
        .post('/attendance/face')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          image: testImage,
          location: {
            latitude: -6.2088,
            longitude: 106.8456
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('attendanceId');
    });

    it('should fail with invalid location', async () => {
      const testImage = fs.readFileSync(
        path.join(__dirname, '../test-data/test-face.jpg'),
        { encoding: 'base64' }
      );

      const response = await request(app)
        .post('/attendance/face')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          image: testImage,
          location: {
            latitude: 0,
            longitude: 0
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /attendance/qr', () => {
    it('should record attendance with valid QR code', async () => {
      const response = await request(app)
        .post('/attendance/qr')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qrData: JSON.stringify({
            sessionId: 'test-session',
            timestamp: Date.now(),
            validUntil: Date.now() + 5 * 60 * 1000
          }),
          location: {
            latitude: -6.2088,
            longitude: 106.8456
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('attendanceId');
    });

    it('should fail with expired QR code', async () => {
      const response = await request(app)
        .post('/attendance/qr')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qrData: JSON.stringify({
            sessionId: 'test-session',
            timestamp: Date.now() - 10 * 60 * 1000,
            validUntil: Date.now() - 5 * 60 * 1000
          }),
          location: {
            latitude: -6.2088,
            longitude: 106.8456
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /attendance/report', () => {
    it('should return attendance report for valid date range', async () => {
      const response = await request(app)
        .get('/attendance/report')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('stats');
      expect(Array.isArray(response.body.records)).toBe(true);
    });

    it('should fail with invalid date range', async () => {
      const response = await request(app)
        .get('/attendance/report')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: 'invalid-date',
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
