import { Router } from 'express';
import { UserService } from '../services/UserService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const userService = new UserService();

// Register new user
router.post('/register',
    authenticateToken,
    authorizeRoles(['ADMIN']),
    async (req, res) => {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await userService.authenticate(email, password);
        res.json({ token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Update user
router.put('/:id',
    authenticateToken,
    async (req, res) => {
        try {
            // Only allow users to update their own profile unless admin
            if (req.user!.id !== req.params.id && req.user!.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const user = await userService.updateUser(req.params.id, req.body);
            res.json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Get user profile
router.get('/:id/profile',
    authenticateToken,
    async (req, res) => {
        try {
            const profile = await userService.getUserProfile(req.params.id);
            res.json(profile);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

export default router;
