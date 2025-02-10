import { PrismaClient, User, Role, Class, Enrollment } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { NotFoundError, ValidationError, AuthError } from '../utils/errors';

const prisma = new PrismaClient();

interface CreateUserDTO {
    email: string;
    name: string;
    password: string;
    role: Role;
}

interface UpdateUserDTO {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
}

interface UserProfile extends Omit<User, 'password'> {
    enrollments?: (Enrollment & {
        class: Class & {
            teacher: User;
            schedule: any;
        };
    })[];
    classes?: Class[];
}

export class UserService {
    async createUser(data: CreateUserDTO): Promise<User> {
        // Validate email format
        if (!this.isValidEmail(data.email)) {
            throw new ValidationError('Invalid email format');
        }

        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new ValidationError('Email already registered');
        }

        // Hash password
        const hashedPassword = await hash(data.password, 10);

        return await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword
            }
        });
    }

    async authenticate(email: string, password: string): Promise<string> {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new AuthError('Invalid credentials');
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
            throw new AuthError('Invalid credentials');
        }

        // Ensure JWT_SECRET is defined
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }

        return sign(
            { id: user.id, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '24h' }
        );
    }

    async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (data.email && !this.isValidEmail(data.email)) {
            throw new ValidationError('Invalid email format');
        }

        if (data.password) {
            data.password = await hash(data.password, 10);
        }

        return await prisma.user.update({
            where: { id },
            data
        });
    }

    async getUserProfile(id: string): Promise<UserProfile> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        class: {
                            include: {
                                teacher: true,
                                schedule: true
                            }
                        }
                    }
                },
                classes: true // For teachers
            }
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Remove sensitive data
        const { password, ...profile } = user;
        return profile;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
