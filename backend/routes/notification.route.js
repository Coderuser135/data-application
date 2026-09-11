import { Router } from 'express';
import { getMyNotifications, markRead, markAllRead, getUnreadCount, broadcastNotification } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/', authMiddleware, getMyNotifications);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.patch('/mark-all-read', authMiddleware, markAllRead);
router.patch('/:id/read', authMiddleware, markRead);
router.post('/broadcast', adminMiddleware, broadcastNotification);
export default router;
