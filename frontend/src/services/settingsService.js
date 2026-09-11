import api from './apiClient';

export const settingsService = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (data) => api.put('/settings', data).then((r) => r.data),
};

export const gymSettingsService = {
  get: () => api.get('/gym-settings').then((r) => r.data),
  update: (data) => api.put('/gym-settings', data).then((r) => r.data),
};
