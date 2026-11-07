import api from './apiClient';

export const admissionService = {
  getAll: () => api.get('/admissions').then((response) => response.data),
  getMine: () => api.get('/admissions/mine').then((response) => response.data),
  getById: (id) => api.get(`/admissions/${id}`).then((response) => response.data),
  getMemberOverview: (userId) => api.get(`/admissions/members/${userId}/overview`).then((response) => response.data),
  create: (data) => api.post('/admissions', data).then((response) => response.data),
  searchUsers: (q, page = 1, limit = 10, { admissionFilter = 'all', paymentFilter = 'all', membershipFilter = 'all', registeredWithin = 'all' } = {}) => {
    const params = new URLSearchParams({
      q: q || '',
      page: String(page),
      limit: String(limit),
    });

    if (admissionFilter !== 'all') params.set('admission_filter', admissionFilter);
    if (paymentFilter !== 'all') params.set('payment_filter', paymentFilter);
    if (membershipFilter !== 'all') params.set('membership_filter', membershipFilter);
    if (registeredWithin !== 'all') params.set('registered_within', registeredWithin);

    return api.get(`/admissions/search/users?${params.toString()}`)
      .then((response) => response.data);
  },
};
