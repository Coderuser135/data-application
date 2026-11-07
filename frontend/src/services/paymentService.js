import api from './apiClient';

export const paymentService = {
  getMine: () => api.get('/payments/mine').then((r) => r.data),
  getAll: () => api.get('/payments').then((r) => r.data),
  createRazorpayOrder: (data) => api.post('/payments/razorpay/order', data).then((r) => r.data),
  verifyRazorpayPayment: (data) => api.post('/payments/razorpay/verify', data).then((r) => r.data),
};
