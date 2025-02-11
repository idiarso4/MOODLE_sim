import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import { auditLogService } from '../services/auditLog';
import { uploadImage } from '../services/faceRecognition';

const router = Router();
const prisma = new PrismaClient();

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  faceImage?: string;
}

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log successful login
    await auditLogService.createFromRequest(req, 'LOGIN', 'user', {
      userId: user.id,
      email: user.email
    });

    res.json({ token, user: { ...user, password: undefined } });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, faceImage }: RegisterRequest = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Process face image if provided
    let faceImageUrl: string | undefined;
    if (faceImage) {
      faceImageUrl = await uploadImage(faceImage);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        faceImageUrl
      }
    });

    // Log user creation
    await auditLogService.createFromRequest(req, 'REGISTER', 'user', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({ ...user, password: undefined });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        enrollments: {
          include: {
            class: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ ...user, password: undefined });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, email, currentPassword, newPassword, faceImage } = req.body;

    // Verify current password if changing password
    if (newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid current password' });
      }
    }

    // Process face image if provided
    let faceImageUrl: string | undefined;
    if (faceImage) {
      faceImageUrl = await uploadImage(faceImage);
    }

    // Update user
    const updateData: any = {
      name,
      email,
      ...(newPassword && {
        password: await bcrypt.hash(newPassword, 10)
      }),
      ...(faceImageUrl && { faceImageUrl })
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: updateData
    });

    // Log profile update
    await auditLogService.createFromRequest(req, 'UPDATE_PROFILE', 'user', {
      userId: updatedUser.id,
      email: updatedUser.email
    });

    res.json({ ...updatedUser, password: undefined });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router;
