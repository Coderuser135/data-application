import * as orderService from '../services/order.service.js';

export const getMyOrders = async (req, res, next) => {
  try { res.json(await orderService.getOrdersByUserId(req.user._id)); } catch (err) { next(err); }
};
export const getAllOrders = async (req, res, next) => {
  try { res.json(await orderService.getAllOrders()); } catch (err) { next(err); }
};
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, fulfillmentMethod, customerName, customerPhone, checkoutRequestId } = req.body;
    res.status(201).json(await orderService.createOrder(req.user._id, { items, shippingAddress, fulfillmentMethod, customerName, customerPhone, checkoutRequestId }));
  } catch (err) { next(err); }
};
export const updateOrderStatus = async (req, res, next) => {
  try { res.json(await orderService.updateOrderStatus(req.params.id, req.body.status)); } catch (err) { next(err); }
};