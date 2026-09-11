import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, default: 0, min: 0 },
  original_price: { type: Number, default: null, min: 0 },
  duration_days: { type: Number, required: true, default: 30, min: 1 },
  features: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
  display_order: { type: Number, default: 0 },
  is_offer: { type: Boolean, default: false },
  offer_label: { type: String, default: '' },
  offer_start_date: { type: Date, default: null },
  offer_end_date: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('MembershipPlan', membershipPlanSchema);
