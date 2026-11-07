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
  const mrp = numberField(data.mrp, 'MRP', { nullable: true });
  const cost_price = numberField(data.cost_price, 'cost price', { nullable: true });
  const stock_quantity = numberField(data.stock_quantity ?? 0, 'stock quantity');
  const low_stock_threshold = numberField(data.low_stock_threshold ?? 5, 'low stock threshold');
  if (mrp !== null && price > mrp) throw new ApiError(400, 'Selling price cannot be greater than MRP');
  if (!Number.isInteger(stock_quantity) || !Number.isInteger(low_stock_threshold)) throw new ApiError(400, 'Stock values must be whole numbers');
  return { name, brand, price, mrp, cost_price, stock_quantity, low_stock_threshold };
}

const cleanProduct = (product) => product;

export async function getProducts({
  search = '',
  category = 'all',
  status = 'all',
  stock = 'all',
  expiry = 'all',
  sort = 'newest',
  page = 1,
  limit = 10,
} = {}) {
  const now = new Date();
  const filter = { is_deleted: { $ne: true } };

  if (search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { brand: { $regex: safeSearch, $options: 'i' } },
      { sku: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (category !== 'all') filter.category_id = category;
  if (status === 'active') filter.is_active = true;
  if (status === 'inactive') filter.is_active = false;

  if (stock === 'out') {
    filter.$expr = { $lte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, 0] };
  } else if (stock === 'low') {
    filter.$expr = {
      $and: [
        { $gt: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, 0] },
        { $lte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, '$low_stock_threshold'] },
      ],
    };
  } else if (stock === 'in') {
    filter.$expr = { $gt: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, '$low_stock_threshold'] };
  }

  if (expiry === 'expired') {
    filter.expiry_date = { $lt: now };
  } else if (expiry === '30') {
    filter.expiry_date = { $gte: now, $lte: new Date(now.getTime() + 30 * 86400000) };
  } else if (expiry === 'no_date') {
    filter.$and = [...(filter.$and || []), { $or: [{ expiry_date: null }, { expiry_date: { $exists: false } }] }];
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const sortOptions = {
    newest: { createdAt: -1 },
    name_asc: { name: 1 },
    price_low: { price: 1 },
    price_high: { price: -1 },
    stock_low: { stock_quantity: 1 },
  };
  const [products, total, stats] = await Promise.all([
    Product.find(filter)
      .populate('category_id')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Product.countDocuments(filter),
    Product.aggregate([
      { $match: { is_deleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          low: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, 0] },
                    { $lte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, '$low_stock_threshold'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          out: {
            $sum: {
              $cond: [
                { $lte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, 0] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const rows = products.map((product) => {
    const available = Math.max(0, Number(product.stock_quantity || 0) - Number(product.reserved_quantity || 0));
    return {
      ...product,
      available_quantity: available,
      stock_status: available === 0
        ? 'out_of_stock'
        : available <= Number(product.low_stock_threshold || 0) ? 'low_stock' : 'in_stock',
    };
  });

  return {
    rows,
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
    limit: safeLimit,
    stats: stats[0] || { total: 0, low: 0, out: 0 },
  };
}
function publicProductData(product) {
  const data = product.toObject ? product.toObject() : { ...product };
  data.available_quantity = Math.max(0, Number(data.stock_quantity || 0) - Number(data.reserved_quantity || 0));
  data.stock_status = data.available_quantity <= 0
    ? 'out_of_stock'
    : data.available_quantity <= Number(data.low_stock_threshold || 0) ? 'low_stock' : 'in_stock';
  delete data.cost_price;
  delete data.reserved_quantity;
  delete data.image_public_id;
  if (Array.isArray(data.images)) {
    data.images = data.images.map(({ url, alt_text, is_primary }) => ({ url, alt_text, is_primary }));
  }
  return data;
}

export async function getActiveProducts({
  search = '',
  category = 'all',
  stock = 'all',
  sort = 'featured',
  page = 1,
  limit = 12,
  minPrice,
  maxPrice,
} = {}) {
  const now = new Date();
  const filter = {
    is_active: true,
    is_deleted: { $ne: true },
    $or: [{ expiry_date: null }, { expiry_date: { $gt: now } }],
  };

  if (String(search).trim()) {
    const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\\]\\\\]/g, '\\export async function getActiveProducts() {
  const products = await Product.find({ is_active: true, is_deleted: { $ne: true }, $or: [{ expiry_date: null }, { expiry_date: { $gt: new Date() } }] })
    .populate({ path: 'category_id', match: { is_active: true } }).sort({ is_featured: -1, createdAt: -1 });
  return products.map((product) => {
    const data = product.toObject();
    data.available_quantity = Math.max(0, data.stock_quantity - data.reserved_quantity);
    data.stock_status = data.available_quantity <= 0 ? 'out_of_stock' : data.available_quantity <= data.low_stock_threshold ? 'low_stock' : 'in_stock';
    delete data.cost_price;
    delete data.reserved_quantity;
    delete data.image_public_id;
    if (Array.isArray(data.images)) data.images = data.images.map(({ url, alt_text, is_primary }) => ({ url, alt_text, is_primary }));
    return data;
  });
}
export async function getProductById(id) {
  return Product.findOne({ _id: id, is_active: true, is_deleted: { $ne: true } }).populate('category_id');
}');
    filter.$and = [
      ...(filter.$and || []),
      { $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { brand: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ] },
    ];
  }
  if (category && category !== 'all') filter.category_id = category;
  if (stock === 'in') filter.$expr = { $gt: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, 0] };
  if (minPrice !== undefined && minPrice !== '') filter.price = { ...(filter.price || {}), $gte: Math.max(0, Number(minPrice) || 0) };
  if (maxPrice !== undefined && maxPrice !== '') filter.price = { ...(filter.price || {}), $lte: Math.max(0, Number(maxPrice) || 0) };

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(24, Math.max(1, Number(limit) || 12));
  const sortOptions = {
    featured: { is_featured: -1, createdAt: -1 },
    newest: { createdAt: -1 },
    name_asc: { name: 1 },
    price_low: { price: 1 },
    price_high: { price: -1 },
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate({ path: 'category_id', match: { is_active: true } })
      .sort(sortOptions[sort] || sortOptions.featured)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return {
    rows: products.map(publicProductData),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
    limit: safeLimit,
  };
}

export async function getActiveProductById(id) {
  const product = await Product.findOne({
    _id: id,
    is_active: true,
    is_deleted: { $ne: true },
    $or: [{ expiry_date: null }, { expiry_date: { $gt: new Date() } }],
  }).populate({ path: 'category_id', match: { is_active: true } });
  if (!product || (product.category_id === null && product.category_id !== undefined)) {
    // Uncategorized supplements are valid; only a referenced inactive category is hidden.
    const raw = product ? await Product.findById(id).select('category_id').lean() : null;
    if (!product || raw?.category_id) return null;
  }
  return product ? publicProductData(product) : null;
}

export async function getProductById(id) {
  return Product.findOne({ _id: id, is_active: true, is_deleted: { $ne: true } }).populate('category_id');
}

export async function createProduct(data, image) {
  const values = validateProductInput(data);
  const sku = `SUP-${Date.now().toString(36).toUpperCase()}`;
  if (data.category_id) {
    const category = await ProductCategory.findOne({ _id: data.category_id, is_active: true });
    if (!category) throw new ApiError(400, 'Category not found or inactive');
  }
  const product = await Product.create({
    ...values,
    sku,
    category_id: data.category_id || null,
    slug: `${slugify(values.name)}-${sku.toLowerCase()}`,
    description: String(data.description || '').trim(),
    net_quantity: String(data.net_quantity || '').trim(),
    expiry_date: data.expiry_date || null,
    image_url: image?.secure_url || '',
    image_public_id: image?.public_id || '',
    images: image ? [{ url: image.secure_url, public_id: image.public_id, alt_text: values.name, is_primary: true }] : [],
    is_active: data.is_active !== false && data.is_active !== 'false',
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
  const product = await Product.findOne({ _id: id, is_deleted: { $ne: true } });
  if (!product) throw new ApiError(404, 'Supplement not found');
  const merged = {
    name: data.name ?? product.name,
    brand: data.brand ?? product.brand,
    price: data.price ?? product.price,
    mrp: data.mrp !== undefined ? data.mrp : product.mrp,
    cost_price: data.cost_price !== undefined ? data.cost_price : product.cost_price,
    stock_quantity: product.stock_quantity,
    low_stock_threshold: data.low_stock_threshold ?? product.low_stock_threshold,
  };
  const values = validateProductInput(merged);
  if (data.category_id) {
    const category = await ProductCategory.findOne({ _id: data.category_id, is_active: true });
    if (!category) throw new ApiError(400, 'Category not found or inactive');
  }
  Object.assign(product, values, {
    slug: data.name !== undefined ? `${slugify(values.name)}-${product.sku.toLowerCase()}` : product.slug,
    category_id: data.category_id !== undefined ? (data.category_id || null) : product.category_id,
    description: data.description !== undefined ? String(data.description).trim() : product.description,
    net_quantity: data.net_quantity !== undefined ? String(data.net_quantity).trim() : product.net_quantity,
    expiry_date: data.expiry_date !== undefined ? (data.expiry_date || null) : product.expiry_date,
    is_active: data.is_active !== undefined
      ? data.is_active === true || data.is_active === 'true'
      : product.is_active,
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
  const product = await Product.findOne({ _id: id, is_deleted: { $ne: true } });
  if (!product) throw new ApiError(404, 'Supplement not found');
  const linkedOrders = await (await import('../models/order.model.js')).default.exists({ 'order_items.product_id': id, inventory_status: 'reserved' });
  if (linkedOrders) throw new ApiError(409, 'This supplement is linked to an active order and cannot be deleted');
  product.is_active = false;
  product.is_deleted = true;
  await product.save();
  return product;
}

export async function adjustStock(id, data, performedBy) {
  const quantity = Number(data.quantity);
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity === 0) throw new ApiError(400, 'Stock adjustment must be a non-zero whole number');
  const reason = String(data.reason || '').trim();
  if (!reason) throw new ApiError(400, 'A reason is required for every stock adjustment');
  const product = await Product.findOne({ _id: id, is_deleted: { $ne: true } });
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
  if (await Product.countDocuments({ category_id: id, is_deleted: { $ne: true } })) throw new ApiError(409, 'Category is in use by supplements');
  category.is_active = false; await category.save(); return category;
}
