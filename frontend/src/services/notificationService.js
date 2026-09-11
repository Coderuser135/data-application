import api from './apiClient';

export const notificationService = {
  getMine: () => api.get('/notifications').then((r) => r.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/mark-all-read').then((r) => r.data),
};
