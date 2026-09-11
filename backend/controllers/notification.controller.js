import * as notificationService from '../services/notificatioin.service.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getMyNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getNotificationsByUserId(req.user._id);
    res.json(notifications);
  } catch (err) { next(err); }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user._id);
    res.json(notification);
  } catch (err) { next(err); }
}

export async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (err) { next(err); }
}

export async function broadcastNotification(req, res, next) {
  try {
    const { title, message } = req.body;
    if (!title || !title.trim()) throw new ApiError(400, 'Title is required');
    if (!message || !message.trim()) throw new ApiError(400, 'Message is required');
    const result = await notificationService.broadcastToAllUsers({ title: title.trim(), message: message.trim() });
    res.json(result);
  } catch (err) { next(err); }
}
