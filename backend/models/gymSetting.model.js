import mongoose from 'mongoose';

const gymSettingsSchema = new mongoose.Schema({
  gym_name: { type: String, default: 'Heaven Gym' },
  contact_phone: { type: String, default: '+91 96501 23729' },
  contact_email: { type: String, default: '' },
  address: { type: String, default: 'Jhanda Chowk, near LG showroom, Naya Tola, Purnia, Bihar 854301, India' },
  opening_hours: { type: String, default: 'Monday – Saturday: 6:00 AM – 10:30 PM; Sunday: 7:30 AM – 10:30 PM' },
  maps_url: { type: String, default: 'https://www.google.com/maps/search/?api=1&query=Heaven+Gym%2C+Jhanda+Chowk%2C+near+LG+showroom%2C+Naya+Tola%2C+Purnia%2C+Bihar+854301' },
  membership_advance_amount: { type: Number, default: 0, min: 0 },
  low_stock_threshold: { type: Number, default: 10, min: 0 },
}, { timestamps: true });

gymSettingsSchema.index({ _id: 1 });

export default mongoose.model('GymSettings', gymSettingsSchema);
