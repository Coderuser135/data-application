import Product from '../models/product.model.js';
import ProductCategory from '../models/productCategory.model.js';
import { slugify } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

function validateProductInput(data) {
  const price = Number(data.price);
  const salePrice = data.sale_price === null || data.sale_price === '' || data.sale_price === undefined ? null : Number(data.sale_price);
  const stock = Number(data.stock_quantity ?? 0);
  if (!String(data.name || '').trim()) throw new ApiError(400, 'Product name is required');
  if (!Number.isFinite(price) || price < 0) throw new ApiError(400, 'Invalid product price');
  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) throw new ApiError(400, 'Invalid sale price');
  if (!Number.isInteger(stock) || stock < 0) throw new ApiError(400, 'Invalid stock quantity');
  return { price, sale_price: salePrice, stock_quantity: stock };
}

export async function getProducts() { return Product.find().populate('category_id').sort({ createdAt: -1 }); }
export async function getActiveProducts() { return Product.find({ is_active: true }).populate({ path: 'category_id', match: { is_active: true } }).sort({ createdAt: -1 }); }
export async function getProductById(id) { return Product.findOne({ _id: id, is_active: true }).populate({ path: 'category_id', match: { is_active: true } }); }

export async function createProduct(data) {
  const values = validateProductInput(data);
  const slug = slugify(data.name);
  if (data.category_id) {
    const category = await ProductCategory.findOne({ _id: data.category_id, is_active: true });
    if (!category) throw new ApiError(400, 'Category not found or inactive');
  }
  return Product.create({ category_id: data.category_id || null, name: String(data.name).trim(), description: data.description || '', image_url: data.image_url || '', is_active: data.is_active !== false, slug, ...values });
}

export async function updateProduct(id, data) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  const next = { name: data.name !== undefined ? String(data.name).trim() : product.name, price: data.price !== undefined ? data.price : product.price, sale_price: data.sale_price !== undefined ? data.sale_price : product.sale_price, stock_quantity: data.stock_quantity !== undefined ? data.stock_quantity : product.stock_quantity };
  const values = validateProductInput(next);
  const update = { ...values, name: next.name, description: data.description !== undefined ? data.description : product.description, image_url: data.image_url !== undefined ? data.image_url : product.image_url, category_id: data.category_id !== undefined ? data.category_id || null : product.category_id, is_active: data.is_active !== undefined ? Boolean(data.is_active) : product.is_active };
  if (data.category_id) {
    const category = await ProductCategory.findOne({ _id: data.category_id, is_active: true });
    if (!category) throw new ApiError(400, 'Category not found or inactive');
  }
  if (data.name !== undefined) update.slug = slugify(next.name);
  Object.assign(product, update);
  await product.save();
  return product;
}

export async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.is_active = false;
  await product.save();
  return product;
}

export async function getCategories() { return ProductCategory.find({ is_active: true }).sort({ name: 1 }); }

export async function createCategory(data) {
  if (!String(data.name || '').trim()) throw new ApiError(400, 'Category name is required');
  return ProductCategory.create({ name: String(data.name).trim(), description: data.description || '', slug: slugify(data.name), is_active: true });
}

export async function updateCategory(id, data) {
  const category = await ProductCategory.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (data.name !== undefined) {
    if (!String(data.name).trim()) throw new ApiError(400, 'Category name is required');
    category.name = String(data.name).trim(); category.slug = slugify(category.name);
  }
  if (data.description !== undefined) category.description = String(data.description);
  if (data.is_active !== undefined) category.is_active = Boolean(data.is_active);
  await category.save();
  return category;
}

export async function deleteCategory(id) {
  const category = await ProductCategory.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  const productCount = await Product.countDocuments({ category_id: id, is_active: true });
  if (productCount > 0) throw new ApiError(409, 'Category is in use by active products');
  category.is_active = false;
  await category.save();
  return category;
}
