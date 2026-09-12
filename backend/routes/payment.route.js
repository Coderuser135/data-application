import { Router } from 'express';
import { getMyPayments, getAllPayments, createRazorpayOrder, verifyRazorpayPayment, refundPayment } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/mine', authMiddleware, getMyPayments);
router.post('/razorpay/order', authMiddleware, createRazorpayOrder);
router.post('/razorpay/verify', authMiddleware, verifyRazorpayPayment);
router.get('/', adminMiddleware, getAllPayments);
router.post('/:id/refund', adminMiddleware, refundPayment);
export default router;
