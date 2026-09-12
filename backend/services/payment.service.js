import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Payment from '../models/payment.model.js';
import Membership from '../models/membership.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { ApiError } from '../utils/errors.utils.js';

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
export async function getAllPayments() { return Payment.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 }); }

export async function createRazorpayOrder(userId, { orderId, membershipId }) {
  if ((orderId && membershipId) || (!orderId && !membershipId)) throw new ApiError(400, 'A single payment target is required');
  let amount; let paymentType;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user_id: userId, payment_status: 'pending', status: 'pending' });
    if (!order) throw new ApiError(404, 'Pending order not found');
    amount = order.total_amount; paymentType = 'order';
  } else {
    const membership = await Membership.findOne({ _id: membershipId, user_id: userId, status: 'pending' });
    if (!membership) throw new ApiError(404, 'Pending membership not found');
    amount = membership.plan_price_snapshot; paymentType = 'membership_full';
  }
  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Invalid payment amount');
  const targetFilter = orderId ? { order_id: orderId } : { membership_id: membershipId };
  const existing = await Payment.findOne({ user_id: userId, ...targetFilter, status: 'pending', razorpay_order_id: { $ne: '' } });
  if (existing) {
    const existingOrder = await gateway().orders.fetch(existing.razorpay_order_id).catch(() => null);
    if (existingOrder && existingOrder.status !== 'paid') return { payment: existing, keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder: existingOrder };
  }
  const razorpayOrder = await gateway().orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `${paymentType}-${Date.now()}` });
  const payment = await Payment.create({ user_id: userId, order_id: orderId || null, membership_id: membershipId || null, amount, payment_type: paymentType, payment_method: 'online', status: 'pending', razorpay_order_id: razorpayOrder.id });
  return { payment, keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder };
}

async function finalizeSuccessfulPayment(paymentId, userId, razorpayPaymentId, signature, session) {
  const query = { _id: paymentId }; if (userId) query.user_id = userId;
  const payment = await Payment.findOne(query).session(session);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status === 'success') return payment;
  if (payment.status === 'refunded') throw new ApiError(409, 'Payment has already been refunded');
  payment.status = 'success';
  if (razorpayPaymentId) { payment.razorpay_payment_id = razorpayPaymentId; payment.transaction_id = razorpayPaymentId; }
  if (signature) payment.razorpay_signature = signature;
  payment.payment_date = new Date();
  await payment.save({ session });

  if (payment.membership_id) {
    const membership = await Membership.findOne({ _id: payment.membership_id, user_id: payment.user_id, status: 'pending' }).session(session);
    if (!membership) throw new ApiError(409, 'Pending membership not found');
    const startDate = new Date(); const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + membership.duration_days);
    membership.start_date = startDate; membership.end_date = endDate; membership.status = 'active';
    await membership.save({ session });
  }
  if (payment.order_id) {
    const order = await Order.findOne({ _id: payment.order_id, user_id: payment.user_id, payment_status: 'pending', status: 'pending' }).session(session);
    if (!order) throw new ApiError(409, 'Pending order not found');
    for (const item of order.order_items) {
      const result = await Product.updateOne({ _id: item.product_id, is_active: true, stock_quantity: { $gte: item.quantity } }, { $inc: { stock_quantity: -item.quantity } }, { session });
      if (result.modifiedCount !== 1) throw new ApiError(409, 'Stock changed while payment was processing. Payment will be reconciled by webhook/admin.');
    }
    order.payment_status = 'success'; order.payment_id = payment._id; order.status = 'confirmed'; await order.save({ session });
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

export async function refundPayment(paymentId, { note = '' } = {}) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status !== 'success') throw new ApiError(409, 'Only successful payments can be refunded');
  if (payment.status === 'refunded' || payment.refund_id) throw new ApiError(409, 'Payment is already refunded');
  if (payment.payment_method !== 'online' || !payment.razorpay_payment_id) throw new ApiError(400, 'Only Razorpay payments can be refunded automatically');

  const refund = await gateway().payments.refund(payment.razorpay_payment_id, { amount: Math.round(payment.amount * 100) });
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      updated = await Payment.findOneAndUpdate(
        { _id: payment._id, status: 'success', refund_id: '' },
        { $set: { status: 'refunded', refund_id: refund.id, refunded_amount: payment.amount, refund_date: new Date(), reference_note: note || payment.reference_note } },
        { new: true, session }
      );
      if (!updated) throw new ApiError(409, 'Payment refund state changed. Please refresh and try again.');

      if (payment.order_id) {
        const order = await Order.findOne({ _id: payment.order_id, payment_id: payment._id }).session(session);
        if (order && order.status !== 'delivered') {
          for (const item of order.order_items) {
            await Product.updateOne({ _id: item.product_id }, { $inc: { stock_quantity: item.quantity } }, { session });
          }
          order.payment_status = 'refunded';
          order.status = 'cancelled';
          await order.save({ session });
        }
      }
      if (payment.membership_id) {
        await Membership.updateOne({ _id: payment.membership_id, user_id: payment.user_id, status: 'active' }, { $set: { status: 'cancelled' } }, { session });
      }
    });
    return updated;
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
