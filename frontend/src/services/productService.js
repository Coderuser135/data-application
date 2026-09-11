import api from './apiClient';

export const productService = {
  getAll: () => api.get('/products').then((r) => r.data),
  getActive: () => api.get('/products/active').then((r) => r.data),
  create: (data) => api.post('/products', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const categoryService = {
  getAll: () => api.get('/products/categories').then((r) => r.data),
  create: (data) => api.post('/products/categories', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/categories/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/products/categories/${id}`).then((r) => r.data),
};
