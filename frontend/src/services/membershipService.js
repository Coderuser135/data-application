import api from './apiClient';

export const membershipService = {
  getMine: () => api.get('/memberships/mine').then((r) => r.data),
  getAll: (params = {}) => api.get('/memberships', { params }).then((r) => r.data),
  getDetails: (id) => api.get(`/memberships/${id}/details`).then((r) => r.data),
  getActivePlans: () => api.get('/memberships/plans/active').then((r) => r.data),
  getAdvancePaid: (membershipId) => api.get('/memberships/advance', { params: { membershipId } }).then((r) => r.data),
  purchase: (planId) => api.post('/memberships/purchase', { planId }).then((r) => r.data),
  payAdvance: (membershipId) => api.post('/memberships/advance', { membershipId }).then((r) => r.data),
  renew: (id) => api.post(`/memberships/${id}/renew`).then((r) => r.data),
  adminRenew: (id) => api.post(`/memberships/${id}/admin-renew`).then((r) => r.data),
  extend: (id, days) => api.post(`/memberships/${id}/extend`, { days }).then((r) => r.data),
  freeze: (id) => api.post(`/memberships/${id}/freeze`).then((r) => r.data),
  resume: (id) => api.post(`/memberships/${id}/resume`).then((r) => r.data),
};
