import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();

router.use(protect);
router.get('/', listNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;