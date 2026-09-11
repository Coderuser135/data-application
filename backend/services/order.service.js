import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { generateOrderNumber } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export async function getOrdersByUserId(userId) {
  return Order.find({ user_id: userId }).sort({ createdAt: -1 });
}

export async function getAllOrders() {
  return Order.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 });
}

export async function createOrder(userId, items, shippingAddress) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Cart cannot be empty');
  if (!String(shippingAddress || '').trim()) throw new ApiError(400, 'Shipping address is required');
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const productId = item.product?.id || item.product?._id || item.productId;
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new ApiError(400, 'Invalid cart item');
    const product = await Product.findOne({ _id: productId, is_active: true });
    if (!product) throw new ApiError(404, 'Product is unavailable');
    if (product.stock_quantity < quantity) throw new ApiError(400, `Insufficient stock for: ${product.name}`);
    const price = product.sale_price ?? product.price;
    const subtotal = price * quantity;
    totalAmount += subtotal;
    orderItems.push({ product_id: product._id, product_name_snapshot: product.name, product_price_snapshot: price, quantity, subtotal });
  }

  return Order.create({
    user_id: userId,
    order_number: generateOrderNumber(),
    total_amount: totalAmount,
    status: 'pending',
    shipping_address: String(shippingAddress).trim(),
    payment_status: 'pending',
    order_items: orderItems,
  });
}

export async function updateOrderStatus(orderId, status) {
  if (!orderStatuses.includes(status)) throw new ApiError(400, 'Invalid order status');
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  order.status = status;
  await order.save();
  return order;
}
