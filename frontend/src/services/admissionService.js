import api from './apiClient';

export const admissionService = {
  getAll: () => api.get('/admissions').then((r) => r.data),
  getMine: () => api.get('/admissions/mine').then((r) => r.data),
  create: (data) => api.post('/admissions', data).then((r) => r.data),
  searchUsers: (q, page = 1, limit = 20) => api.get(`/admissions/search/users?q=${encodeURIComponent(q || '')}&page=${page}&limit=${limit}`).then((r) => r.data),
};
