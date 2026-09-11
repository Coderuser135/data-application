import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  type: { type: String, default: 'general' },
  is_read: { type: Boolean, default: false },
  related_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  related_type: { type: String, default: '' },
}, { timestamps: true });

notificationSchema.index({ user_id: 1 });

export default mongoose.model('Notification', notificationSchema);
