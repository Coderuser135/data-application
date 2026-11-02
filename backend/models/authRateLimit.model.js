import mongoose from 'mongoose';

const authRateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  reset_at: { type: Date, required: true },
}, { timestamps: true });

authRateLimitSchema.index({ reset_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AuthRateLimit', authRateLimitSchema);
