import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Payment from '../models/payment.model.js';
import Membership from '../models/membership.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import InventoryMovement from '../models/inventoryMovement.model.js';
import { ApiError } from '../utils/errors.utils.js';
import { allocateMembershipAdvance } from './membership.service.js';

function gateway() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new ApiError(503, 'Online payments are not configured');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}
function verifySignature(orderId, paymentId, signature) {
  if (!orderId || !paymentId || !signature || !process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function getPaymentsByUserId(userId) { return Payment.find({ user_id: userId }).sort({ createdAt: -1 }); }
export async function getAllPayments({ page = 1, limit = 10, status = 'all', type = 'all', search = '' } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(5, Number.parseInt(limit, 10) || 10));
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (type !== 'all') filter.payment_type = type;
  if (search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'i');
    const User = (await import('../models/user.model.js')).default;
    const matchingUsers = await User.find({ $or: [{ full_name: regex }, { email: regex }] }).select('_id').lean();
    filter.$or = [
      { transaction_id: regex },
      { razorpay_payment_id: regex },
      { razorpay_order_id: regex },
      { user_id: { $in: matchingUsers.map((user) => user._id) } },
    ];
  }
  const [items, total, summary] = await Promise.all([
    Payment.find(filter).populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1, _id: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
    Payment.countDocuments(filter),
    Payment.aggregate([{ $group: {
      _id: null,
      gymRevenue: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'success'] }, { $ne: ['$payment_type', 'order'] }] }, '$amount', 0] } },
      storeRevenue: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'success'] }, { $eq: ['$payment_type', 'order'] }] }, '$amount', 0] } },
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      reconciliationRequired: { $sum: { $cond: [{ $eq: ['$status', 'reconciliation_required'] }, 1, 0] } },
      totalTransactions: { $sum: 1 },
    } }]),
  ]);
  return {
    items,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.max(1, Math.ceil(total / safeLimit)) },
    summary: summary[0] || { gymRevenue: 0, storeRevenue: 0, pending: 0, reconciliationRequired: 0, totalTransactions: 0 },
  };
}

export async function createRazorpayOrder(userId, { orderId, membershipId }) {
  if ((orderId && membershipId) || (!orderId && !membershipId)) throw new ApiError(400, 'A single payment target is required');
  let amount; let paymentType;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user_id: userId, payment_status: 'pending', status: 'pending', inventory_status: 'reserved', reservation_expires_at: { $gt: new Date() } });
    if (!order) throw new ApiError(404, 'Pending order not found');
    amount = order.total_amount; paymentType = 'order';
  } else {
    const membership = await Membership.findOne({ _id: membershipId, user_id: userId, status: 'pending', payment_status: 'pending' });
    if (!membership) throw new ApiError(404, 'Pending membership not found');
    amount = Number(membership.amount_due ?? membership.plan_price_snapshot); paymentType = 'membership_full';
  }
  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Invalid payment amount');
  const targetFilter = orderId ? { order_id: orderId } : { membership_id: membershipId };

  // Never create a second chargeable Razorpay order while an earlier order
  // for the same gym-store order may already have captured the customer's money.
  if (orderId) {
    const completedPayment = await Payment.findOne({
      user_id: userId,
      order_id: orderId,
      status: { $in: ['success', 'reconciliation_required'] },
    });
    if (completedPayment?.status === 'success') {
      throw new ApiError(409, 'This order already has a successful payment. Please refresh your orders.');
    }
    if (completedPayment?.status === 'reconciliation_required') {
      throw new ApiError(409, 'A payment was received for this order and requires Heaven Gym admin reconciliation. Do not pay again.');
    }
  }

  const existing = await Payment.findOne({ user_id: userId, ...targetFilter, status: 'pending', razorpay_order_id: { $ne: '' } });
  if (existing) {
    const existingOrder = await gateway().orders.fetch(existing.razorpay_order_id).catch(() => null);
    if (existingOrder?.status === 'paid') {
      throw new ApiError(409, 'The previous payment appears captured and is being verified. Do not make another payment; please contact Heaven Gym if your order does not update.');
    }
    if (existingOrder && existingOrder.status !== 'paid') return { payment: existing, keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder: existingOrder };
  }
  // Razorpay Orders API does not support the Payment Links-only `expire_by` field.
  // The gym app enforces its own stock reservation expiry before creating payments.
  let razorpayOrder;
  try {
    razorpayOrder = await gateway().orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `${paymentType}-${Date.now()}`,
    });
  } catch (error) {
    const providerError = error?.error || error?.response?.data?.error || {};
    console.error(JSON.stringify({
      level: 'error',
      event: 'razorpay_order_creation_failed',
      providerStatus: error?.statusCode || error?.status || error?.response?.status || null,
      providerCode: providerError.code || error?.code || null,
      providerDescription: providerError.description || error?.description || error?.message || 'Unknown Razorpay error',
      providerField: providerError.field || null,
      providerReason: providerError.reason || null,
    }));
    throw new ApiError(502, 'Online payment is temporarily unavailable. Please try again shortly.');
  }
  const payment = await Payment.create({ user_id: userId, order_id: orderId || null, membership_id: membershipId || null, amount, payment_type: paymentType, payment_method: 'online', status: 'pending', razorpay_order_id: razorpayOrder.id });
  return { payment, keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder };
}

async function finalizeSuccessfulPayment(paymentId, userId, razorpayPaymentId, signature, session) {
  const query = { _id: paymentId }; if (userId) query.user_id = userId;
  const payment = await Payment.findOne(query).session(session);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status === 'success') return payment;
  if (payment.status === 'refunded') throw new ApiError(409, 'Payment has already been refunded');

  // Validate stock reservation inside this transaction before fulfillment.
  // If Razorpay captured money after the reservation expired, preserve the
  // captured payment as an exception for admin reconciliation; never fulfill
  // an order whose stock has already been released.
  let reservedOrder = null;
  if (payment.order_id) {
    reservedOrder = await Order.findOne({
      _id: payment.order_id,
      user_id: payment.user_id,
      payment_status: 'pending',
      status: 'pending',
      inventory_status: 'reserved',
      reservation_expires_at: { $gt: new Date() },
    }).session(session);
    if (!reservedOrder) {
      payment.status = 'reconciliation_required';
      if (razorpayPaymentId) {
        payment.razorpay_payment_id = razorpayPaymentId;
        payment.transaction_id = razorpayPaymentId;
      }
      if (signature) payment.razorpay_signature = signature;
      payment.payment_date = new Date();
      payment.reference_note = 'Payment captured after order stock reservation expired. Do not fulfill automatically; admin reconciliation required.';
      await payment.save({ session });
      return payment;
    }
  }

  payment.status = 'success';
  if (razorpayPaymentId) { payment.razorpay_payment_id = razorpayPaymentId; payment.transaction_id = razorpayPaymentId; }
  if (signature) payment.razorpay_signature = signature;
  payment.payment_date = new Date();
  await payment.save({ session });

  if (payment.membership_id) {
    const membership = await Membership.findOne({ _id: payment.membership_id, user_id: payment.user_id, status: 'pending', payment_status: 'pending' }).session(session);
    if (!membership) throw new ApiError(409, 'Pending membership not found');
    // Settle only the amount actually received. A successful partial payment
    // must not mark the entire membership as paid.
    const storedDue = Number(membership.amount_due);
    const expectedDue = Math.max(
      0,
      Number(membership.plan_price_snapshot || 0) - Number(membership.advance_paid || 0),
    );
    const currentDue = Number.isFinite(storedDue) && storedDue > 0 ? storedDue : expectedDue;
    membership.amount_due = Math.max(0, Number((currentDue - Number(payment.amount || 0)).toFixed(2)));

    if (membership.amount_due === 0) {
      await allocateMembershipAdvance(payment.user_id, membership, session);
      const startDate = membership.start_date ? new Date(membership.start_date) : new Date();
      const endDate = membership.end_date ? new Date(membership.end_date) : new Date(startDate);
      if (!membership.end_date) endDate.setDate(endDate.getDate() + membership.duration_days);
      const now = new Date();
      membership.start_date = startDate;
      membership.end_date = endDate;
      membership.payment_status = 'paid';
      membership.status = startDate > now ? 'scheduled' : 'active';
    } else {
      membership.payment_status = 'pending';
      membership.status = 'pending';
    }
    await membership.save({ session });
  }
  if (reservedOrder) {
    const order = reservedOrder;

    for (const item of order.order_items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product_id, is_active: true, stock_quantity: { $gte: item.quantity }, reserved_quantity: { $gte: item.quantity } },
        { $inc: { stock_quantity: -item.quantity, reserved_quantity: -item.quantity } },
        { new: false, session },
      );
      if (!product) throw new ApiError(409, 'Reserved stock is inconsistent. Payment requires reconciliation.');
      await InventoryMovement.create([{
        product_id: product._id,
        movement_type: 'order_sale',
        quantity: -item.quantity,
        stock_before: product.stock_quantity,
        stock_after: product.stock_quantity - item.quantity,
        reserved_before: product.reserved_quantity,
        reserved_after: product.reserved_quantity - item.quantity,
        reason: `Paid order ${order.order_number}; reserved stock converted to sale`,
        reference_id: order._id,
      }], { session });
    }

    order.payment_status = 'success';
    order.payment_id = payment._id;
    order.inventory_status = 'committed';
    order.status = 'processing';
    await order.save({ session });
  }
  return payment;
}

export async function verifyRazorpayPayment(userId, payload) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = payload;
  if (!verifySignature(orderId, paymentId, signature)) throw new ApiError(400, 'Payment verification failed');
  const razorpayPayment = await gateway().payments.fetch(paymentId);
  if (!razorpayPayment || razorpayPayment.order_id !== orderId || razorpayPayment.currency !== 'INR') throw new ApiError(400, 'Payment details do not match the order');
  if (Number(razorpayPayment.amount) <= 0) throw new ApiError(400, 'Invalid gateway amount');
  const session = await mongoose.startSession();
  try {
    let verifiedPayment;
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ razorpay_order_id: orderId, user_id: userId }).session(session);
      if (!payment) throw new ApiError(404, 'Payment not found');
      if (Math.round(Number(payment.amount) * 100) !== Number(razorpayPayment.amount)) throw new ApiError(400, 'Payment amount mismatch');
      if (razorpayPayment.status !== 'captured') throw new ApiError(400, 'Payment has not been captured');
      verifiedPayment = await finalizeSuccessfulPayment(payment._id, userId, paymentId, signature, session);
    });
    return verifiedPayment;
  } finally { await session.endSession(); }
}

export async function handleRazorpayWebhook(rawBody, signature, eventPayload) {
  if (!verifyWebhookSignature(rawBody, signature)) throw new ApiError(400, 'Invalid webhook signature');
  const event = eventPayload?.event;
  if (!['payment.captured', 'payment.failed'].includes(event)) return { received: true, processed: false };
  const entity = eventPayload?.payload?.payment?.entity;
  if (!entity?.id || !entity?.order_id) return { received: true, processed: false };
  const payment = await Payment.findOne({ razorpay_order_id: entity.order_id });
  if (!payment) return { received: true, processed: false };
  if (event === 'payment.failed') {
    if (payment.status === 'pending') { payment.status = 'failed'; payment.razorpay_payment_id = entity.id; payment.reference_note = entity.error_description || payment.reference_note; await payment.save(); }
    return { received: true, processed: true };
  }
  if (entity.currency !== 'INR' || Number(entity.amount) !== Math.round(payment.amount * 100)) throw new ApiError(400, 'Webhook payment amount mismatch');
  const session = await mongoose.startSession();
  try { await session.withTransaction(async () => { await finalizeSuccessfulPayment(payment._id, null, entity.id, null, session); }); }
  finally { await session.endSession(); }
  return { received: true, processed: true };
}
