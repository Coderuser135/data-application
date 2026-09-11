import { Router } from 'express';
import { getMyMeasurements, getAllMeasurements, createMeasurement, getAdmittedUsers, getMeasurementsByUser } from '../controllers/measuremen.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/mine', authMiddleware, getMyMeasurements);
router.get('/members', adminMiddleware, getAdmittedUsers);
router.get('/user/:userId', adminMiddleware, getMeasurementsByUser);
router.get('/', adminMiddleware, getAllMeasurements);
router.post('/', adminMiddleware, createMeasurement);
export default router;
