import { Router } from 'express';
import { getAllAdmissions, getMyAdmission, createAdmission, searchUsers, updateAdmission } from '../controllers/admission.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/mine', authMiddleware, getMyAdmission);
router.get('/search/users', adminMiddleware, searchUsers);
router.get('/', adminMiddleware, getAllAdmissions);
router.post('/', adminMiddleware, createAdmission);
router.put('/:id', adminMiddleware, updateAdmission);
export default router;
