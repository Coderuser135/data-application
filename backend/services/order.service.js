import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import InventoryMovement from '../models/inventoryMovement.model.js';
import { generateOrderNumber } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const allowedTransitions = {
  pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'], delivered: [], cancelled: [],
};

export async function getOrdersByUserId(userId) {
  return Order.find({ user_id: userId }).sort({ createdAt: -1 });
}
export async function getAllOrders() {
  return Order.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 });
}

async function releaseExpiredReservations(session) {
  const expiredOrders = await Order.find({
    status: 'pending', payment_status: { $in: ['pending', 'failed'] },
    inventory_status: 'reserved', reservation_expires_at: { $lte: new Date() },
  }).session(session);
  for (const order of expiredOrders) {
    for (const item of order.order_items) {
      if (!item.product_id) continue;
      const product = await Product.findById(item.product_id).session(session);
      if (!product) continue;
      const beforeReserved = product.reserved_quantity;
      product.reserved_quantity = Math.max(0, beforeReserved - item.quantity);
      await product.save({ session });
      await InventoryMovement.create([{
        product_id: product._id, movement_type: 'order_release', quantity: item.quantity,
        stock_before: product.stock_quantity, stock_after: product.stock_quantity,
        reserved_before: beforeReserved, reserved_after: product.reserved_quantity,
        reason: `Expired reservation for order ${order.order_number}`, reference_id: order._id,
      }], { session });
    }
    order.inventory_status = 'released';
    order.status = 'cancelled';
    await order.save({ session });
  }
}

export async function createOrder(userId, items, shippingAddress) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Cart cannot be empty');
  if (!String(shippingAddress || '').trim()) throw new ApiError(400, 'Shipping address is required');
  const quantities = new Map();
  for (const item of items) {
    const productId = item.product?.id || item.product?._id || item.productId;
    const quantity = Number(item.quantity);
    if (!productId || !mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new ApiError(400, 'Invalid cart item');
    quantities.set(String(productId), (quantities.get(String(productId)) || 0) + quantity);
  }

  const session = await mongoose.startSession();
  let createdOrder;
  try {
    await session.withTransaction(async () => {
      await releaseExpiredReservations(session);
      const orderItems = [];
      let totalAmount = 0;
      for (const [productId, quantity] of quantities) {
        const product = await Product.findOneAndUpdate(
          { _id: productId, is_active: true, is_deleted: false, $expr: { $gte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, quantity] } },
          { $inc: { reserved_quantity: quantity } },
          { new: false, session },
        );
        if (!product) throw new ApiError(409, 'One or more supplements are unavailable or have insufficient stock');
        const price = product.sale_price ?? product.price;
        const subtotal = price * quantity;
        totalAmount += subtotal;
        orderItems.push({ product_id: product._id, product_name_snapshot: product.name, product_price_snapshot: price, quantity, subtotal });
      }
      const [order] = await Order.create([{
        user_id: userId, order_number: generateOrderNumber(), total_amount: totalAmount,
        status: 'pending', shipping_address: String(shippingAddress).trim(),
        payment_status: 'pending', inventory_status: 'reserved',
        reservation_expires_at: new Date(Date.now() + 30 * 60 * 1000), order_items: orderItems,
      }], { session });
      createdOrder = order;
      for (const item of orderItems) {
        const product = await Product.findById(item.product_id).session(session);
        await InventoryMovement.create([{
          product_id: item.product_id, movement_type: 'order_reserved', quantity: item.quantity,
          stock_before: product.stock_quantity, stock_after: product.stock_quantity,
          reserved_before: product.reserved_quantity - item.quantity, reserved_after: product.reserved_quantity,
          reason: 'Stock reserved for customer order', reference_id: order._id,
        }], { session });
      }
    });
    return createdOrder;
  } finally {
    await session.endSession();
  }
}

export async function updateOrderStatus(orderId, status) {
  if (!orderStatuses.includes(status)) throw new ApiError(400, 'Invalid order status');
  const session = await mongoose.startSession();
  let updatedOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new ApiError(404, 'Order not found');
      if (order.status === status) { updatedOrder = order; return; }
      if (!allowedTransitions[order.status]?.includes(status)) throw new ApiError(409, `Cannot move order from ${order.status} to ${status}`);
      if (status === 'confirmed' && order.payment_status !== 'success') throw new ApiError(409, 'Order cannot be confirmed before successful payment');
      if (status === 'cancelled' && order.payment_status === 'success') throw new ApiError(409, 'Paid orders require a refund flow before cancellation');

      if (status === 'confirmed' && order.inventory_status === 'reserved') {
        for (const item of order.order_items) {
          const product = await Product.findById(item.product_id).session(session);
          if (!product || product.reserved_quantity < item.quantity || product.stock_quantity < item.quantity) throw new ApiError(409, 'Reserved stock is no longer available; contact support');
          const beforeStock = product.stock_quantity;
          const beforeReserved = product.reserved_quantity;
          product.stock_quantity -= item.quantity;
          product.reserved_quantity -= item.quantity;
          await product.save({ session });
          await InventoryMovement.create([{
            product_id: product._id, movement_type: 'order_sale', quantity: -item.quantity,
            stock_before: beforeStock, stock_after: product.stock_quantity,
            reserved_before: beforeReserved, reserved_after: product.reserved_quantity,
            reason: `Stock committed for order ${order.order_number}`, reference_id: order._id,
          }], { session });
        }
        order.inventory_status = 'committed';
      }

      if (status === 'cancelled' && order.inventory_status === 'reserved') {
        for (const item of order.order_items) {
          const product = await Product.findById(item.product_id).session(session);
          if (!product) continue;
          const beforeReserved = product.reserved_quantity;
          product.reserved_quantity = Math.max(0, beforeReserved - item.quantity);
          await product.save({ session });
          await InventoryMovement.create([{
            product_id: product._id, movement_type: 'order_release', quantity: item.quantity,
            stock_before: product.stock_quantity, stock_after: product.stock_quantity,
            reserved_before: beforeReserved, reserved_after: product.reserved_quantity,
            reason: `Reservation released for order ${order.order_number}`, reference_id: order._id,
          }], { session });
        }
        order.inventory_status = 'released';
      }
      order.status = status;
      await order.save({ session });
      updatedOrder = order;
    });
    return updatedOrder;
  } finally {
    await session.endSession();
  }
}
