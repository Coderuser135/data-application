import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/errors.utils.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (notification) {
      notification.is_read = true;
      await notification.save();
    }

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user_id: req.user._id, is_read: false },
      { $set: { is_read: true } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user._id,
      is_read: false,
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message } = req.body;

    if (!title || !title.trim()) {
      throw new ApiError(400, 'Title is required');
    }

    if (!message || !message.trim()) {
      throw new ApiError(400, 'Message is required');
    }

    const users = await User.find({}, '_id').lean();

    if (users.length === 0) {
      return res.json({ sent: 0 });
    }

    const notifications = users.map((user) => ({
      user_id: user._id,
      title: title.trim(),
      message: message.trim(),
      type: 'broadcast',
      is_read: false,
    }));

    await Notification.insertMany(notifications, { ordered: false });
    res.json({ sent: users.length });
  } catch (error) {
    next(error);
  }
};
