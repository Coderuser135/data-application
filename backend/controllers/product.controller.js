import * as productService from '../services/products.service.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.utils.js';

const parseProductBody = (body) => {
  const data = { ...body };
  if (data.is_active !== undefined) {
    data.is_active = data.is_active === true || data.is_active === 'true';
  }
  return data;
};

export const getProducts = async (req, res, next) => {
  try { res.json(await productService.getProducts(req.query)); } catch (err) { next(err); }
};
export const getActiveProducts = async (req, res, next) => {
  try { res.json(await productService.getActiveProducts()); } catch (err) { next(err); }
};
export const createProduct = async (req, res, next) => {
  let uploadedImage;
  try {
    if (req.file) uploadedImage = await uploadToCloudinary(req.file.buffer);
    const product = await productService.createProduct(parseProductBody(req.body), uploadedImage);
    res.status(201).json(product);
  } catch (err) {
    if (uploadedImage?.public_id) await deleteFromCloudinary(uploadedImage.public_id).catch(() => {});
    next(err);
  }
};
export const updateProduct = async (req, res, next) => {
  let uploadedImage;
  try {
    if (req.file) uploadedImage = await uploadToCloudinary(req.file.buffer);
    const existing = await productService.getProductById(req.params.id);
    const product = await productService.updateProduct(req.params.id, parseProductBody(req.body), uploadedImage);
    if (uploadedImage && existing?.image_public_id) await deleteFromCloudinary(existing.image_public_id).catch(() => {});
    res.json(product);
  } catch (err) {
    if (uploadedImage?.public_id) await deleteFromCloudinary(uploadedImage.public_id).catch(() => {});
    next(err);
  }
};
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (product.image_public_id) await deleteFromCloudinary(product.image_public_id).catch(() => {});
    res.json({ message: 'Supplement deleted' });
  } catch (err) { next(err); }
};
export const adjustStock = async (req, res, next) => {
  try { res.json(await productService.adjustStock(req.params.id, req.body, req.user?._id)); } catch (err) { next(err); }
};
export const getStockHistory = async (req, res, next) => {
  try { res.json(await productService.getStockHistory(req.params.id)); } catch (err) { next(err); }
};
export const getCategories = async (req, res, next) => {
  try { res.json(await productService.getCategories()); } catch (err) { next(err); }
};
export const createCategory = async (req, res, next) => {
  try { res.status(201).json(await productService.createCategory(req.body)); } catch (err) { next(err); }
};
export const updateCategory = async (req, res, next) => {
  try { res.json(await productService.updateCategory(req.params.id, req.body)); } catch (err) { next(err); }
};
export const deleteCategory = async (req, res, next) => {
  try { await productService.deleteCategory(req.params.id); res.json({ message: 'Category deleted' }); } catch (err) { next(err); }
};
