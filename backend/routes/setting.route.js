import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', authMiddleware, getSettings);
router.put('/', authMiddleware, updateSettings);
export default router;
