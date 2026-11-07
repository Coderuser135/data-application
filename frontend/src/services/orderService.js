import api from './apiClient';

export const orderService = {
  getMine: () => api.get('/orders/mine').then((r) => r.data),
  getAll: (params = {}) => api.get('/orders', { params }).then((r) => r.data),
  create: (data) => api.post('/orders', data).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};
