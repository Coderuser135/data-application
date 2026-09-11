import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membership_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  amount: { type: Number, required: true, min: 0 },
  payment_type: { type: String, enum: ['membership_advance', 'membership_installment', 'membership_full', 'order'], required: true },
  payment_method: { type: String, enum: ['online', 'cash', 'other'], default: 'online' },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  transaction_id: { type: String, default: '' },
  razorpay_order_id: { type: String, default: '', index: true },
  razorpay_payment_id: { type: String, default: '' },
  razorpay_signature: { type: String, default: '' },
  reference_note: { type: String, default: '' },
  payment_date: { type: Date, default: Date.now },
}, { timestamps: true });

paymentSchema.index({ user_id: 1, membership_id: 1 });

export default mongoose.model('Payment', paymentSchema);
