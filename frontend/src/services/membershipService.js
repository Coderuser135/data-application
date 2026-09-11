import api from './apiClient';

export const membershipService = {
  getMine: () => api.get('/memberships/mine').then((r) => r.data),
  getAll: () => api.get('/memberships').then((r) => r.data),
  getActivePlans: () => api.get('/memberships/plans/active').then((r) => r.data),
  getAdvancePaid: (membershipId) => api.get('/memberships/advance', { params: { membershipId } }).then((r) => r.data),
  purchase: (planId) => api.post('/memberships/purchase', { planId }).then((r) => r.data),
  payAdvance: (membershipId) => api.post('/memberships/advance', { membershipId }).then((r) => r.data),
  renew: (id) => api.post(`/memberships/${id}/renew`).then((r) => r.data),
};
