import { Router } from 'express';
import { getGymSettings, updateGymSettings } from '../controllers/gymSetting.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/', authMiddleware, getGymSettings);
router.put('/', adminMiddleware, updateGymSettings);
export default router;
