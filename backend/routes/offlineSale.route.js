import { Router } from 'express';
import { createOfflineSale, getOfflineSale } from '../controllers/offlineSale.controller.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/:id', adminMiddleware, getOfflineSale);
router.post('/', adminMiddleware, createOfflineSale);
export default router;
