import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Reset database to clean state before tests
  await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
  await prisma.$executeRaw`CREATE SCHEMA public`;
  
  // Run migrations
  execSync('npx prisma migrate deploy');
  
  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function seedTestData() {
  // Create test user
  const teacher = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$10$dGvgxUY5dUg4KqPQP5Rh8eJqfCJZPPKhEwc2K5ViSZYg5L8Q6ZJ6q', // password: test123
      role: 'TEACHER'
    }
  });

  // Create test class
  await prisma.class.create({
    data: {
      name: 'Test Class',
      code: 'TST-001',
      teacherId: teacher.id
    }
  });
}
