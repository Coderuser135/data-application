import api from './apiClient';

export const userService = {
  getProfile: () => api.get('/users/me').then((r) => r.data),
  updateProfile: (data) => api.put('/users/me', data).then((r) => r.data),
  getAllUsers: () => api.get('/users').then((r) => r.data),
};
