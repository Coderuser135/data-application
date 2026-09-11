import { Router } from 'express';
import { getProfile, updateProfile, getAllUsers } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.get('/', adminMiddleware, getAllUsers);
export default router;
