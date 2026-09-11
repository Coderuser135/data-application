import api from './apiClient';

export const measurementService = {
  getMine: () => api.get('/measurements/mine').then((r) => r.data),
  getAll: () => api.get('/measurements').then((r) => r.data),
  getByUser: (userId) => api.get(`/measurements/user/${userId}`).then((r) => r.data),
  create: (data) => api.post('/measurements', data).then((r) => r.data),
  getMembers: () => api.get('/measurements/members').then((r) => r.data),
};
