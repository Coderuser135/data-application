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

export async function getPaymentsByUserId(userId) {
  return Payment.find({ user_id: userId }).sort({ createdAt: -1 });
}

export async function getAllPayments() {
  return Payment.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 });
}

export async function createRazorpayOrder(userId, { orderId, membershipId }) {
  if ((orderId && membershipId) || (!orderId && !membershipId)) throw new ApiError(400, 'A single payment target is required');
  let amount;
  let paymentType;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user_id: userId, payment_status: 'pending' });
    if (!order) throw new ApiError(404, 'Pending order not found');
    amount = order.total_amount;
    paymentType = 'order';
  } else {
    const membership = await Membership.findOne({ _id: membershipId, user_id: userId, status: 'pending' });
    if (!membership) throw new ApiError(404, 'Pending membership not found');
    amount = membership.plan_price_snapshot;
    paymentType = 'membership_full';
  }
  const existing = await Payment.findOne({ user_id: userId, ...(orderId ? { order_id: orderId } : { membership_id: membershipId }), status: 'pending', razorpay_order_id: { $ne: '' } });
  if (existing) return { payment: existing, keyId: process.env.RAZORPAY_KEY_ID };

  const razorpayOrder = await gateway().orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `${paymentType}-${Date.now()}` });
  const payment = await Payment.create({ user_id: userId, order_id: orderId || null, membership_id: membershipId || null, amount, payment_type: paymentType, payment_method: 'online', status: 'pending', razorpay_order_id: razorpayOrder.id });
  return { payment, keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder };
}

export async function verifyRazorpayPayment(userId, payload) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = payload;
  if (!orderId || !paymentId || !signature) throw new ApiError(400, 'Incomplete payment verification data');
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) throw new ApiError(400, 'Payment verification failed');

  const session = await mongoose.startSession();
  try {
    let verifiedPayment;
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ razorpay_order_id: orderId, user_id: userId }).session(session);
      if (!payment) throw new ApiError(404, 'Payment not found');
      if (payment.status === 'success') { verifiedPayment = payment; return; }
      payment.status = 'success';
      payment.razorpay_payment_id = paymentId;
      payment.razorpay_signature = signature;
      payment.transaction_id = paymentId;
      payment.payment_date = new Date();
      await payment.save({ session });
      verifiedPayment = payment;

      if (payment.membership_id) {
        await Membership.updateOne({ _id: payment.membership_id, user_id: userId, status: 'pending' }, { $set: { status: 'active' } }, { session });
      }
      if (payment.order_id) {
        const order = await Order.findOne({ _id: payment.order_id, user_id: userId, payment_status: 'pending' }).session(session);
        if (!order) throw new ApiError(404, 'Pending order not found');
        for (const item of order.order_items) {
          const result = await Product.updateOne({ _id: item.product_id, is_active: true, stock_quantity: { $gte: item.quantity } }, { $inc: { stock_quantity: -item.quantity } }, { session });
          if (result.modifiedCount !== 1) throw new ApiError(409, 'Stock changed while payment was processing');
        }
        order.payment_status = 'success';
        order.payment_id = payment._id;
        order.status = 'confirmed';
        await order.save({ session });
      }
    });
    return verifiedPayment;
  } finally {
    await session.endSession();
  }
}
