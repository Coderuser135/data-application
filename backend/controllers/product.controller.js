import * as productService from '../services/products.service.js';

export async function getProducts(req, res, next) {
  try {
    const products = await productService.getProducts();
    res.json(products);
  } catch (err) { next(err); }
}

export async function getActiveProducts(req, res, next) {
  try {
    const products = await productService.getActiveProducts();
    res.json(products);
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) { next(err); }
}

export async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) { next(err); }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (err) { next(err); }
}

export async function createCategory(req, res, next) {
  try {
    const category = await productService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) { next(err); }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await productService.updateCategory(req.params.id, req.body);
    res.json(category);
  } catch (err) { next(err); }
}

export async function deleteCategory(req, res, next) {
  try {
    await productService.deleteCategory(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
}
