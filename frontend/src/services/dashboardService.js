import api from './apiClient';

export const dashboardService = {
  getAdminStats: () => api.get('/dashboard/admin').then((r) => r.data),
  getRevenueAnalytics: (period) => api.get(`/dashboard/admin/analytics?period=${period}`).then((r) => r.data),
  getUserDashboard: () => api.get('/dashboard/user').then((r) => r.data),
};
