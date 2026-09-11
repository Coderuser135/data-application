import { Router } from 'express';
import { getMyOrders, getAllOrders, createOrder, updateOrderStatus } from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/mine', authMiddleware, getMyOrders);
router.post('/', authMiddleware, createOrder);
router.get('/', adminMiddleware, getAllOrders);
router.patch('/:id/status', adminMiddleware, updateOrderStatus);
export default router;
