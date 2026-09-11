import { Router } from 'express';
import { getAdminStats, getUserDashboard, getRevenueAnalytics } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/admin', adminMiddleware, getAdminStats);
router.get('/admin/analytics', adminMiddleware, getRevenueAnalytics);
router.get('/user', authMiddleware, getUserDashboard);
export default router;
