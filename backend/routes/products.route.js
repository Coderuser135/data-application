import { Router } from 'express';
import {
  getProducts, getActiveProducts, getActiveProductById, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, updateCategory, deleteCategory, adjustStock, getStockHistory,
} from '../controllers/product.controller.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();
router.get('/categories', getCategories);
router.post('/categories', adminMiddleware, createCategory);
router.put('/categories/:id', adminMiddleware, updateCategory);
router.delete('/categories/:id', adminMiddleware, deleteCategory);
router.get('/active', getActiveProducts);
router.get('/:id', getActiveProductById);
router.get('/', adminMiddleware, getProducts);
router.post('/', adminMiddleware, upload.single('image'), createProduct);
router.post('/:id/stock-adjustments', adminMiddleware, adjustStock);
router.get('/:id/stock-history', adminMiddleware, getStockHistory);
router.put('/:id', adminMiddleware, upload.single('image'), updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);
export default router;
