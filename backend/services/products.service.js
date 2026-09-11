import Product from '../models/product.model.js';
import ProductCategory from '../models/productCategory.model.js';
import { slugify } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getProducts() {
  return Product.find().populate('category_id').sort({ createdAt: -1 });
}

export async function getActiveProducts() {
  return Product.find({ is_active: true }).populate('category_id').sort({ createdAt: -1 });
}

export async function getProductById(id) {
  return Product.findById(id).populate('category_id');
}

export async function createProduct(data) {
  const slug = slugify(data.name);
  return Product.create({ ...data, slug });
}

export async function updateProduct(id, data) {
  const update = { ...data };
  if (data.name) update.slug = slugify(data.name);
  return Product.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteProduct(id) {
  return Product.findByIdAndDelete(id);
}

export async function getCategories() {
  return ProductCategory.find().sort({ name: 1 });
}

export async function createCategory(data) {
  const slug = slugify(data.name);
  return ProductCategory.create({ ...data, slug });
}

export async function updateCategory(id, data) {
  const update = { ...data };
  if (data.name) update.slug = slugify(data.name);
  return ProductCategory.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteCategory(id) {
  return ProductCategory.findByIdAndDelete(id);
}
