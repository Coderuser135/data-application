import { Router } from 'express';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../controllers/membershipPlan.controller.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/', getAllPlans);
router.post('/', adminMiddleware, createPlan);
router.put('/:id', adminMiddleware, updatePlan);
router.delete('/:id', adminMiddleware, deletePlan);
export default router;
