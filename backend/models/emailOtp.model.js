import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose: { type: String, enum: ['verify_email'], required: true },
  otp_hash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expires_at: { type: Date, required: true, index: { expires: 0 } },
  consumed_at: { type: Date, default: null },
  last_sent_at: { type: Date, default: Date.now },
}, { timestamps: true });

emailOtpSchema.index({ user_id: 1, purpose: 1, consumed_at: 1 });
export default mongoose.model('EmailOtp', emailOtpSchema);
