import { Router } from 'express';
import {
  register, login, refresh, logout, logoutAll, me,
  changePassword, forgotPassword, resetPassword,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', authMiddleware, logoutAll);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);

export default router;
