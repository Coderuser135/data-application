import * as paymentService from '../services/payment.service.js';

export async function getMyPayments(req, res, next) {
  try { res.json(await paymentService.getPaymentsByUserId(req.user._id)); } catch (err) { next(err); }
}

export async function getAllPayments(req, res, next) {
  try { res.json(await paymentService.getAllPayments()); } catch (err) { next(err); }
}

export async function createRazorpayOrder(req, res, next) {
  try { res.status(201).json(await paymentService.createRazorpayOrder(req.user._id, req.body)); } catch (err) { next(err); }
}

export async function verifyRazorpayPayment(req, res, next) {
  try { res.json(await paymentService.verifyRazorpayPayment(req.user._id, req.body)); } catch (err) { next(err); }
}
