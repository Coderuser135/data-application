import { Router } from 'express';
import {
  register, verifyEmail, resendVerificationOtp, login, refresh, logout, logoutAll, me,
  changePassword, forgotPassword, verifyPasswordResetOtp, resetPassword, sessionSummary,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-otp', resendVerificationOtp);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/sessions/summary', authMiddleware, sessionSummary);
router.post('/logout', authMiddleware, logout);
router.post('/logout-all', authMiddleware, logoutAll);
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);
export default router;
