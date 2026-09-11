import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gym_admission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GymAdmission', default: null },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
  plan_name_snapshot: { type: String, required: true },
  plan_price_snapshot: { type: Number, required: true },
  duration_days: { type: Number, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  status: { type: String, enum: ['active', 'pending', 'expired', 'cancelled', 'not_purchased'], default: 'pending' },
}, { timestamps: true });

membershipSchema.index({ user_id: 1 });
membershipSchema.index({ status: 1 });

export default mongoose.model('Membership', membershipSchema);
