import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import InventoryMovement from '../models/inventoryMovement.model.js';
import Payment from '../models/payment.model.js';
import { generateOrderNumber } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

const orderStatuses = ['processing', 'ready_for_pickup', 'out_for_delivery', 'collected', 'delivered', 'cancelled', 'confirmed', 'shipped'];
const allowedTransitions = {
  processing: ['ready_for_pickup', 'out_for_delivery'],
  ready_for_pickup: ['collected'],
  out_for_delivery: ['delivered'],
  collected: [],
  delivered: [],
  cancelled: [],
  confirmed: ['shipped'],
  shipped: ['delivered'],
};

export async function getOrdersByUserId(userId) {
  return Order.find({ user_id: userId }).sort({ createdAt: -1 });
}
export async function getAllOrders() {
  return Order.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 });
}

export async function createOrder(userId, { items, shippingAddress, fulfillmentMethod, customerName, customerPhone, checkoutRequestId }) {
  if (!checkoutRequestId || typeof checkoutRequestId !== 'string' || checkoutRequestId.length > 100) throw new ApiError(400, 'Invalid checkout request');
  const existingOrder = await Order.findOne({ user_id: userId, checkout_request_id: checkoutRequestId });
  if (existingOrder) return existingOrder;
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Cart cannot be empty');
  if (!['store_pickup', 'admin_delivery'].includes(fulfillmentMethod)) throw new ApiError(400, 'Choose store pickup or admin delivery');
  if (!String(customerName || '').trim()) throw new ApiError(400, 'Customer name is required');
  if (!String(customerPhone || '').trim()) throw new ApiError(400, 'Customer phone is required');
  if (fulfillmentMethod === 'admin_delivery' && !String(shippingAddress || '').trim()) throw new ApiError(400, 'Delivery address is required');

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
      const orderItems = [];
      let totalAmount = 0;
      for (const [productId, quantity] of quantities) {
        const product = await Product.findOneAndUpdate(
          { _id: productId, is_active: true, is_deleted: { $ne: true }, $expr: { $gte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, quantity] } },
          { $inc: { reserved_quantity: quantity } },
          { new: false, session },
        );
        if (!product) throw new ApiError(409, 'One or more supplements are unavailable or have insufficient stock');
        const price = product.price;
        const subtotal = price * quantity;
        totalAmount += subtotal;
        orderItems.push({ product_id: product._id, product_name_snapshot: product.name, product_price_snapshot: price, quantity, subtotal });
      }
      const addressSnapshot = fulfillmentMethod === 'admin_delivery'
        ? String(shippingAddress).trim()
        : 'Store pickup at Heaven Gym';
      const [order] = await Order.create([{
        user_id: userId, order_number: generateOrderNumber(), total_amount: totalAmount,
        status: 'pending', fulfillment_method: fulfillmentMethod,
        customer_name: String(customerName).trim(), customer_phone: String(customerPhone).trim(),
        shipping_address: addressSnapshot,
        payment_status: 'pending', inventory_status: 'reserved',
        reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        checkout_request_id: checkoutRequestId,
        order_items: orderItems,
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
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateOrder = await Order.findOne({ user_id: userId, checkout_request_id: checkoutRequestId });
      if (duplicateOrder) return duplicateOrder;
    }
    throw error;
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
      const isLegacyOrder = ['confirmed', 'shipped'].includes(order.status);
      if (order.payment_status !== 'success' || (!isLegacyOrder && order.inventory_status !== 'committed')) {
        throw new ApiError(409, 'Only paid orders with committed stock can be fulfilled');
      }
      if (!isLegacyOrder && status === 'ready_for_pickup' && order.fulfillment_method !== 'store_pickup') throw new ApiError(409, 'This order is for admin delivery');
      if (!isLegacyOrder && status === 'out_for_delivery' && order.fulfillment_method !== 'admin_delivery') throw new ApiError(409, 'This order is for store pickup');
      order.status = status;
      await order.save({ session });
      updatedOrder = order;
    });
    return updatedOrder;
  } finally {
    await session.endSession();
  }
}


export async function releaseExpiredOrderReservations() {
  const now = new Date();
  const expiredOrders = await Order.find({
    status: 'pending', payment_status: 'pending', inventory_status: 'reserved',
    reservation_expires_at: { $ne: null, $lte: now },
  }).select('_id order_number order_items');
  let released = 0;

  for (const candidate of expiredOrders) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id: candidate._id, status: 'pending', payment_status: 'pending', inventory_status: 'reserved',
          reservation_expires_at: { $ne: null, $lte: now },
        }).session(session);
        if (!order) return;

        for (const item of order.order_items) {
          const product = await Product.findOneAndUpdate(
            { _id: item.product_id, reserved_quantity: { $gte: item.quantity } },
            { $inc: { reserved_quantity: -item.quantity } },
            { new: false, session },
          );
          if (!product) throw new ApiError(409, `Unable to safely release reserved stock for order ${order.order_number}`);
          await InventoryMovement.create([{
            product_id: product._id, movement_type: 'order_release', quantity: item.quantity,
            stock_before: product.stock_quantity, stock_after: product.stock_quantity,
            reserved_before: product.reserved_quantity, reserved_after: product.reserved_quantity - item.quantity,
            reason: `Reservation expired for unpaid order ${order.order_number}`, reference_id: order._id,
          }], { session });
        }
        order.inventory_status = 'released';
        order.status = 'cancelled';
        await order.save({ session });
        await Payment.updateMany(
          { order_id: order._id, status: 'pending' },
          { $set: { status: 'failed', reference_note: 'Razorpay order expired; stock reservation released.' } },
          { session },
        );
        released += 1;
      });
    } finally { await session.endSession(); }
  }
  return { released };
}
