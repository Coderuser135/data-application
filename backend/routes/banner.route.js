import { Router } from 'express';
import {
  getActiveBanners, getAdminBanners, createBanner, updateBanner, deleteBanner,
} from '../controllers/banner.controller.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();
router.get('/active/:section', getActiveBanners);
router.get('/admin/:section', adminMiddleware, getAdminBanners);
router.post('/admin', adminMiddleware, upload.single('image'), createBanner);
router.put('/admin/:id', adminMiddleware, upload.single('image'), updateBanner);
router.delete('/admin/:id', adminMiddleware, deleteBanner);

export default router;
