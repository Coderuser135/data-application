import api from './apiClient';

export const paymentService = {
  getMine: () => api.get('/payments/mine').then((r) => r.data),
  getAll: (params) => api.get('/payments', { params }).then((r) => r.data),
  createRazorpayOrder: (data) => api.post('/payments/razorpay/order', data).then((r) => r.data),
  verifyRazorpayPayment: (data) => api.post('/payments/razorpay/verify', data).then((r) => r.data),
  confirmReconciliationRefund: (paymentId, data) => api.post(`/payments/${paymentId}/confirm-refund`, data).then((r) => r.data),
};
