import api from './apiClient';

export const membershipPlanService = {
  getAll: () => api.get('/membership-plans').then((r) => r.data),
  create: (data) => api.post('/membership-plans', data).then((r) => r.data),
  update: (id, data) => api.put(`/membership-plans/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/membership-plans/${id}`).then((r) => r.data),
};
