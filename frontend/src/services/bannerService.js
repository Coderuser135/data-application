import api from './apiClient';

export const bannerService = {
  getActive: (section) => api.get(`/banners/active/${section}`).then((r) => r.data),
  getAdmin: (section) => api.get(`/banners/admin/${section}`).then((r) => r.data),
  create: (data) => api.post('/banners/admin', data).then((r) => r.data),
  update: (id, data) => api.put(`/banners/admin/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/banners/admin/${id}`).then((r) => r.data),
};
