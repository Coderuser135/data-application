import { Router } from 'express';
import { getProducts, getActiveProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/product.controller.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();
router.get('/categories', getCategories);
router.post('/categories', adminMiddleware, createCategory);
router.put('/categories/:id', adminMiddleware, updateCategory);
router.delete('/categories/:id', adminMiddleware, deleteCategory);
router.get('/active', getActiveProducts);
router.get('/', getProducts);
router.post('/', adminMiddleware, createProduct);
router.put('/:id', adminMiddleware, updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);
export default router;
