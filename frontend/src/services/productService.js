import api from './apiClient';

function toSupplementFormData(data) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (key === 'image') {
      if (value instanceof File) formData.append('image', value);
      continue;
    }
    formData.append(key, String(value));
  }
  return formData;
}

export const productService = {
  getAll: (params = {}) => api.get('/products', { params }).then((r) => r.data),
  getActive: () => api.get('/products/active').then((r) => r.data),
  create: (data) => api.post('/products', toSupplementFormData(data)).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, toSupplementFormData(data)).then((r) => r.data),
  delete: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  adjustStock: (id, data) => api.post(`/products/${id}/stock-adjustments`, data).then((r) => r.data),
  getStockHistory: (id) => api.get(`/products/${id}/stock-history`).then((r) => r.data),
};

export const categoryService = {
  getAll: () => api.get('/products/categories').then((r) => r.data),
  create: (data) => api.post('/products/categories', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/categories/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/products/categories/${id}`).then((r) => r.data),
};
