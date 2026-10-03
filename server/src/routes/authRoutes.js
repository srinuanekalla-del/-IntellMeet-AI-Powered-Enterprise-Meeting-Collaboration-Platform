import { Router } from 'express';
import { signup, login, refresh, logout } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
