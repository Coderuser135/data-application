import Notification from '../models/notification.model.js';

export async function getNotificationsByUserId(userId) {
  return Notification.find({ user_id: userId }).sort({ createdAt: -1 });
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOne({ _id: notificationId, user_id: userId });
  if (!notification) return null;
  notification.is_read = true;
  await notification.save();
  return notification;
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user_id: userId, is_read: false }, { $set: { is_read: true } });
  return { success: true };
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ user_id: userId, is_read: false });
}

export async function createNotification(data) {
  return Notification.create(data);
}

export async function broadcastToAllUsers({ title, message }) {
  const User = (await import('../models/User.js')).default;
  const users = await User.find({}, '_id');
  if (users.length === 0) return { sent: 0 };
  const docs = users.map((u) => ({
    user_id: u._id,
    title,
    message,
    type: 'broadcast',
    is_read: false,
  }));
  await Notification.insertMany(docs);
  return { sent: users.length };
}
