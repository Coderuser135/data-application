import api from './apiClient';

export const orderService = {
  getMine: () => api.get('/orders/mine').then((r) => r.data),
  getAll: () => api.get('/orders').then((r) => r.data),
  create: (items, shippingAddress) => api.post('/orders', { items, shippingAddress }).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};
