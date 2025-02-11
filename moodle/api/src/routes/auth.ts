import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, User } from '@prisma/client';
import { compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { auditLogService } from '../services/auditLog';

interface JWTPayload {
  id: string;
  email: string;
}

const router = Router();
const prisma = new PrismaClient();

// Middleware to verify JWT token
export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'test-secret') as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login route
router.post('/login', (async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    // Log successful login
    await auditLogService.create({
      userId: user.id,
      action: 'LOGIN',
      resource: 'AUTH',
      details: { email: user.email },
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Profile route (protected)
router.get('/profile', authenticateToken, (async (req: Request, res: Response) => {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  const { password: _, ...userWithoutPassword } = (req as any).user;
  res.json(userWithoutPassword);
}) as RequestHandler);

export { router as authRouter };
