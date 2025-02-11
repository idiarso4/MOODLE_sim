import { UserService } from '../../src/services/UserService';
import { PrismaClient } from '@prisma/client';
import { ValidationError, AuthError } from '../../src/utils/errors';
import { hash } from 'bcrypt';

jest.mock('@prisma/client');

describe('UserService Tests', () => {
    let userService: UserService;
    let prisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        prisma = {
            user: {
                create: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn()
            }
        } as unknown as jest.Mocked<PrismaClient>;
        userService = new UserService();
    });

    describe('createUser', () => {
        const validUserData = {
            email: 'test@example.com',
            name: 'Test User',
            password: 'password123',
            role: 'STUDENT' as const
        };

        it('should create a new user successfully', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                ...validUserData,
                id: '1',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await userService.createUser(validUserData);

            expect(result).toBeDefined();
            expect(result.email).toBe(validUserData.email);
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should throw ValidationError for invalid email', async () => {
            const invalidData = {
                ...validUserData,
                email: 'invalid-email'
            };

            await expect(userService.createUser(invalidData))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw ValidationError for duplicate email', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...validUserData,
                id: '1',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await expect(userService.createUser(validUserData))
                .rejects
                .toThrow(ValidationError);
        });
    });

    describe('authenticate', () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should authenticate valid credentials', async () => {
            const hashedPassword = await hash(credentials.password, 10);
            prisma.user.findUnique.mockResolvedValue({
                id: '1',
                email: credentials.email,
                password: hashedPassword,
                role: 'STUDENT' as const,
                name: 'Test User',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const token = await userService.authenticate(
                credentials.email,
                credentials.password
            );

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('should throw AuthError for invalid email', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(userService.authenticate(
                credentials.email,
                credentials.password
            )).rejects.toThrow(AuthError);
        });

        it('should throw AuthError for invalid password', async () => {
            const hashedPassword = await hash('different-password', 10);
            prisma.user.findUnique.mockResolvedValue({
                id: '1',
                email: credentials.email,
                password: hashedPassword,
                role: 'STUDENT' as const,
                name: 'Test User',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await expect(userService.authenticate(
                credentials.email,
                credentials.password
            )).rejects.toThrow(AuthError);
        });
    });
});
