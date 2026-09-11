import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, default: 'light' },
  language: { type: String, default: 'en' },
  font_size: { type: String, default: 'medium' },
  notify_membership: { type: Boolean, default: true },
  notify_orders: { type: Boolean, default: true },
  notify_payments: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('AppSettings', appSettingsSchema);
