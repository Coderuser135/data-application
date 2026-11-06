import Product from '../models/product.model.js';
import ProductCategory from '../models/productCategory.model.js';
import InventoryMovement from '../models/inventoryMovement.model.js';
import { slugify } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

const numberField = (value, label, { min = 0, max = Number.MAX_SAFE_INTEGER, nullable = false } = {}) => {
  if ((value === '' || value === null || value === undefined) && nullable) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new ApiError(400, `Invalid ${label}`);
  return number;
};

function validateProductInput(data) {
  const name = String(data.name || '').trim();
  const brand = String(data.brand || '').trim();
  if (!name) throw new ApiError(400, 'Supplement name is required');
  if (!brand) throw new ApiError(400, 'Brand is required');
  const price = numberField(data.price, 'selling price');
  const sale_price = numberField(data.sale_price, 'sale price', { nullable: true });
  const mrp = numberField(data.mrp, 'MRP', { nullable: true });
  const cost_price = numberField(data.cost_price, 'cost price', { nullable: true });
  const tax_rate = numberField(data.tax_rate ?? 0, 'tax rate', { max: 100 });
  const stock_quantity = numberField(data.stock_quantity ?? 0, 'stock quantity');
  const low_stock_threshold = numberField(data.low_stock_threshold ?? 5, 'low stock threshold');
  if (sale_price !== null && sale_price > price) throw new ApiError(400, 'Sale price cannot be greater than selling price');
  if (mrp !== null && price > mrp) throw new ApiError(400, 'Selling price cannot be greater than MRP');
  if (!Number.isInteger(stock_quantity) || !Number.isInteger(low_stock_threshold)) throw new ApiError(400, 'Stock values must be whole numbers');
  return { name, brand, price, sale_price, mrp, cost_price, tax_rate, stock_quantity, low_stock_threshold };
}

const cleanProduct = (product) => product;

export async function getProducts() {
  return Product.find({ is_deleted: false }).populate('category_id').sort({ createdAt: -1 });
}
export async function getActiveProducts() {
  return Product.find({ is_active: true, is_deleted: false, expiry_date: { $gt: new Date() } })
    .populate({ path: 'category_id', match: { is_active: true } }).sort({ is_featured: -1, createdAt: -1 });
}
export async function getProductById(id) {
  return Product.findOne({ _id: id, is_active: true, is_deleted: false }).populate('category_id');
}

export async function createProduct(data, image) {
  const values = validateProductInput(data);
  const sku = String(data.sku || `SUP-${Date.now().toString(36).toUpperCase()}`).trim().toUpperCase();
  if (data.category_id) {
    const category = await ProductCategory.findOne({ _id: data.category_id, is_active: true });
    if (!category) throw new ApiError(400, 'Category not found or inactive');
  }
  const product = await Product.create({
    ...values, sku, barcode: data.barcode || '', category_id: data.category_id || null,
    slug: `${slugify(values.name)}-${sku.toLowerCase()}`,
    product_type: data.product_type || 'other', description: data.description || '',
    key_features: Array.isArray(data.key_features) ? data.key_features : [],
    net_quantity: data.net_quantity || '', serving_information: data.serving_information || '',
    ingredients: data.ingredients || '', allergen_information: data.allergen_information || '',
    manufacturer: data.manufacturer || '', country_of_origin: data.country_of_origin || 'India',
    fssai_license_number: data.fssai_license_number || '', batch_number: data.batch_number || '',
    manufacturing_date: data.manufacturing_date || null, expiry_date: data.expiry_date || null,
    storage_instructions: data.storage_instructions || '',
    image_url: image?.secure_url || '', image_public_id: image?.public_id || '',
    images: image ? [{ url: image.secure_url, public_id: image.public_id, alt_text: values.name, is_primary: true }] : [],
    is_active: data.is_active !== false, is_featured: data.is_featured === true,
  });
  if (values.stock_quantity > 0) {
    await InventoryMovement.create({
      product_id: product._id, movement_type: 'opening_stock', quantity: values.stock_quantity,
      stock_before: 0, stock_after: values.stock_quantity, reason: 'Opening stock',
    });
  }
  return cleanProduct(product);
}

export async function updateProduct(id, data, image) {
  const product = await Product.findOne({ _id: id, is_deleted: false });
  if (!product) throw new ApiError(404, 'Supplement not found');
  const merged = {
    name: data.name ?? product.name, brand: data.brand ?? product.brand,
    price: data.price ?? product.price, sale_price: data.sale_price !== undefined ? data.sale_price : product.sale_price,
    mrp: data.mrp !== undefined ? data.mrp : product.mrp, cost_price: data.cost_price !== undefined ? data.cost_price : product.cost_price,
    tax_rate: data.tax_rate ?? product.tax_rate, stock_quantity: product.stock_quantity,
    low_stock_threshold: data.low_stock_threshold ?? product.low_stock_threshold,
  };
  const values = validateProductInput(merged);
  if (data.category_id) {
    const category = await ProductCategory.findOne({ _id: data.category_id, is_active: true });
    if (!category) throw new ApiError(400, 'Category not found or inactive');
  }
  Object.assign(product, values, {
    sku: data.sku !== undefined ? String(data.sku).trim().toUpperCase() : product.sku,
    barcode: data.barcode ?? product.barcode, slug: data.name !== undefined ? `${slugify(values.name)}-${product.sku.toLowerCase()}` : product.slug,
    category_id: data.category_id !== undefined ? (data.category_id || null) : product.category_id,
    product_type: data.product_type ?? product.product_type, description: data.description ?? product.description,
    key_features: data.key_features !== undefined ? data.key_features : product.key_features,
    net_quantity: data.net_quantity ?? product.net_quantity, serving_information: data.serving_information ?? product.serving_information,
    ingredients: data.ingredients ?? product.ingredients, allergen_information: data.allergen_information ?? product.allergen_information,
    manufacturer: data.manufacturer ?? product.manufacturer, country_of_origin: data.country_of_origin ?? product.country_of_origin,
    fssai_license_number: data.fssai_license_number ?? product.fssai_license_number,
    batch_number: data.batch_number ?? product.batch_number,
    manufacturing_date: data.manufacturing_date !== undefined ? (data.manufacturing_date || null) : product.manufacturing_date,
    expiry_date: data.expiry_date !== undefined ? (data.expiry_date || null) : product.expiry_date,
    storage_instructions: data.storage_instructions ?? product.storage_instructions,
    is_active: data.is_active !== undefined ? data.is_active === 'true' || data.is_active === true : product.is_active,
    is_featured: data.is_featured !== undefined ? data.is_featured === 'true' || data.is_featured === true : product.is_featured,
  });
  if (image) {
    product.image_url = image.secure_url;
    product.image_public_id = image.public_id;
    product.images = [{ url: image.secure_url, public_id: image.public_id, alt_text: values.name, is_primary: true }];
  }
  await product.save();
  return product;
}

export async function deleteProduct(id) {
  const product = await Product.findOne({ _id: id, is_deleted: false });
  if (!product) throw new ApiError(404, 'Supplement not found');
  const linkedOrders = await (await import('../models/order.model.js')).default.exists({ 'order_items.product_id': id, inventory_status: { $in: ['reserved', 'committed'] } });
  if (linkedOrders) throw new ApiError(409, 'This supplement is linked to an active order and cannot be deleted');
  product.is_active = false;
  product.is_deleted = true;
  await product.save();
  return product;
}

export async function adjustStock(id, data, performedBy) {
  const quantity = numberField(data.quantity, 'stock adjustment quantity');
  if (!Number.isInteger(quantity) || quantity === 0) throw new ApiError(400, 'Stock adjustment must be a non-zero whole number');
  const reason = String(data.reason || '').trim();
  if (!reason) throw new ApiError(400, 'A reason is required for every stock adjustment');
  const product = await Product.findOne({ _id: id, is_deleted: false });
  if (!product) throw new ApiError(404, 'Supplement not found');
  const before = product.stock_quantity;
  const after = before + quantity;
  if (after < product.reserved_quantity) throw new ApiError(409, 'Cannot reduce stock below the quantity reserved for orders');
  if (after < 0) throw new ApiError(409, 'Stock cannot become negative');
  product.stock_quantity = after;
  await product.save();
  await InventoryMovement.create({
    product_id: product._id, movement_type: quantity > 0 ? 'stock_in' : 'stock_out',
    quantity, stock_before: before, stock_after: after,
    reserved_before: product.reserved_quantity, reserved_after: product.reserved_quantity,
    reason, performed_by: performedBy || null,
  });
  return product;
}

export async function getStockHistory(id) {
  return InventoryMovement.find({ product_id: id }).populate('performed_by', 'full_name').sort({ createdAt: -1 }).limit(100);
}

export async function getCategories() { return ProductCategory.find({ is_active: true }).sort({ name: 1 }); }
export async function createCategory(data) {
  if (!String(data.name || '').trim()) throw new ApiError(400, 'Category name is required');
  return ProductCategory.create({ name: String(data.name).trim(), description: data.description || '', slug: slugify(data.name), is_active: true });
}
export async function updateCategory(id, data) {
  const category = await ProductCategory.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (data.name !== undefined) { if (!String(data.name).trim()) throw new ApiError(400, 'Category name is required'); category.name = String(data.name).trim(); category.slug = slugify(category.name); }
  if (data.description !== undefined) category.description = String(data.description);
  if (data.is_active !== undefined) category.is_active = Boolean(data.is_active);
  await category.save(); return category;
}
export async function deleteCategory(id) {
  const category = await ProductCategory.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (await Product.countDocuments({ category_id: id, is_deleted: false })) throw new ApiError(409, 'Category is in use by supplements');
  category.is_active = false; await category.save(); return category;
}
