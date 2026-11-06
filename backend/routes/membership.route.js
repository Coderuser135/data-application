import { Router } from 'express';
import { getMyMemberships, getAllMemberships, getMembershipDetails, getActivePlans, getAdvancePaid, purchaseMembership, payAdvance, renewMembership, adminRenewMembership, extendMembership, freezeMembership, resumeMembership } from '../controllers/membership.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/mine', authMiddleware, getMyMemberships);
router.get('/plans/active', authMiddleware, getActivePlans);
router.get('/advance', authMiddleware, getAdvancePaid);
router.post('/purchase', authMiddleware, purchaseMembership);
router.post('/advance', authMiddleware, payAdvance);
router.post('/:id/renew', authMiddleware, renewMembership);
router.post('/:id/admin-renew', adminMiddleware, adminRenewMembership);
router.post('/:id/extend', adminMiddleware, extendMembership);
router.post('/:id/freeze', adminMiddleware, freezeMembership);
router.post('/:id/resume', adminMiddleware, resumeMembership);
router.get('/', adminMiddleware, getAllMemberships);
router.get('/:id/details', adminMiddleware, getMembershipDetails);
export default router;
