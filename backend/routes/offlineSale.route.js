import { Router } from 'express';
import { createOfflineSale } from '../controllers/offlineSale.controller.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.post('/', adminMiddleware, createOfflineSale);
export default router;
