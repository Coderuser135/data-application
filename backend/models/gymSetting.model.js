import mongoose from 'mongoose';

const gymSettingsSchema = new mongoose.Schema({
  gym_name: { type: String, default: 'IronForge Gym' },
  contact_phone: { type: String, default: '' },
  contact_email: { type: String, default: '' },
  address: { type: String, default: '' },
  membership_advance_amount: { type: Number, default: 0, min: 0 },
  low_stock_threshold: { type: Number, default: 10, min: 0 },
}, { timestamps: true });

gymSettingsSchema.index({ _id: 1 });

export default mongoose.model('GymSettings', gymSettingsSchema);
