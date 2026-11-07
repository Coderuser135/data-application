import * as paymentService from '../services/payment.service.js';

export const getMyPayments = async (req, res, next) => {
  try { res.json(await paymentService.getPaymentsByUserId(req.user._id)); } catch (err) { next(err); }
};
export const getAllPayments = async (req, res, next) => {
  try { res.json(await paymentService.getAllPayments()); } catch (err) { next(err); }
};
export const createRazorpayOrder = async (req, res, next) => {
  try { res.status(201).json(await paymentService.createRazorpayOrder(req.user._id, req.body)); } catch (err) { next(err); }
};
export const verifyRazorpayPayment = async (req, res, next) => {
  try { res.json(await paymentService.verifyRazorpayPayment(req.user._id, req.body)); } catch (err) { next(err); }
};
export const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.get('x-razorpay-signature');
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    if (!rawBody.length) return res.status(400).json({ error: 'Invalid webhook body' });
    const payload = JSON.parse(rawBody.toString('utf8'));
    res.json(await paymentService.handleRazorpayWebhook(rawBody, signature, payload));
  } catch (err) { next(err); }
};