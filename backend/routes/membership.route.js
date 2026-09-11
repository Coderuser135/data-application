import { Router } from 'express';
import { getMyMemberships, getAllMemberships, getActivePlans, getAdvancePaid, purchaseMembership, payAdvance, renewMembership } from '../controllers/membership.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/mine', authMiddleware, getMyMemberships);
router.get('/plans/active', authMiddleware, getActivePlans);
router.get('/advance', authMiddleware, getAdvancePaid);
router.post('/purchase', authMiddleware, purchaseMembership);
router.post('/advance', authMiddleware, payAdvance);
router.post('/:id/renew', authMiddleware, renewMembership);
router.get('/', adminMiddleware, getAllMemberships);
export default router;
