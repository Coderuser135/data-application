import * as orderService from '../services/order.service.js';

export async function getMyOrders(req, res, next) {
  try { res.json(await orderService.getOrdersByUserId(req.user._id)); } catch (err) { next(err); }
}

export async function getAllOrders(req, res, next) {
  try { res.json(await orderService.getAllOrders()); } catch (err) { next(err); }
}

export async function createOrder(req, res, next) {
  try {
    const { items, shippingAddress } = req.body;
    res.status(201).json(await orderService.createOrder(req.user._id, items, shippingAddress));
  } catch (err) { next(err); }
}

export async function updateOrderStatus(req, res, next) {
  try { res.json(await orderService.updateOrderStatus(req.params.id, req.body.status)); } catch (err) { next(err); }
}
