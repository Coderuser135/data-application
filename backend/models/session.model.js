import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  family_id: { type: String, required: true, index: true },
  device_id: { type: String, default: '', index: true },
  refresh_token_hash: { type: String, required: true },
  used_refresh_token_hashes: { type: [String], default: [] },
  expires_at: { type: Date, required: true },
  last_used_at: { type: Date, default: Date.now },
  revoked_at: { type: Date, default: null },
  revoke_reason: { type: String, default: null },
  user_agent: { type: String, default: '' },
  ip_address: { type: String, default: '' },
}, { timestamps: true });

sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ user_id: 1, revoked_at: 1 });

export default mongoose.model('Session', sessionSchema);
