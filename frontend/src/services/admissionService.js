import api from './apiClient';

export const admissionService = {
  getAll: () => api.get('/admissions').then((response) => response.data),
  getMine: () => api.get('/admissions/mine').then((response) => response.data),
  create: (data) => api.post('/admissions', data).then((response) => response.data),
  searchUsers: (q, page = 1, limit = 20, { excludeAdmins = false } = {}) => {
    const params = new URLSearchParams({
      q: q || '',
      page: String(page),
      limit: String(limit),
    });

    if (excludeAdmins) params.set('exclude_admins', 'true');

    return api.get(`/admissions/search/users?${params.toString()}`)
      .then((response) => response.data);
  },
};
