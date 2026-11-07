import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membership_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },
  gym_admission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GymAdmission', default: null },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  amount: { type: Number, required: true, min: 0 },
  allocated_amount: { type: Number, default: 0, min: 0 },
  payment_type: { type: String, enum: ['membership_advance', 'membership_installment', 'membership_full', 'order'], required: true },
  payment_method: { type: String, enum: ['online', 'cash', 'other'], default: 'online' },
  // Keep the legacy 'refunded' status readable for old records; no refund workflow exists.\n  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded', 'reconciliation_required'], default: 'pending' },
  transaction_id: { type: String, default: '' },
  razorpay_order_id: { type: String, default: '', index: true },
  razorpay_payment_id: { type: String, default: '' },
  razorpay_signature: { type: String, default: '' },
  reference_note: { type: String, default: '' },
  payment_date: { type: Date, default: Date.now },
}, { timestamps: true });

paymentSchema.index({ user_id: 1, membership_id: 1 });
paymentSchema.index({ user_id: 1, gym_admission_id: 1, payment_type: 1, status: 1 });
paymentSchema.index({ user_id: 1, status: 1, createdAt: -1 });
paymentSchema.index({ order_id: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
