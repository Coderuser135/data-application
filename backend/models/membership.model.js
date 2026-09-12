import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gym_admission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GymAdmission', default: null },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
  plan_name_snapshot: { type: String, required: true, trim: true },
  plan_price_snapshot: { type: Number, required: true, min: 0 },
  duration_days: { type: Number, required: true, min: 1 },
  start_date: { type: Date },
  end_date: { type: Date },
  status: { type: String, enum: ['active', 'scheduled', 'pending', 'expired', 'cancelled', 'not_purchased'], default: 'pending' },
  payment_status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
}, { timestamps: true });

membershipSchema.index({ user_id: 1, status: 1 });
membershipSchema.index({ status: 1, start_date: 1 });
membershipSchema.index({ status: 1, end_date: 1 });

export default mongoose.model('Membership', membershipSchema);
