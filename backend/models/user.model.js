import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
  email_verified: { type: Boolean, default: false, index: true },
  email_verified_at: { type: Date, default: null },
  full_name: { type: String, default: '', maxlength: 100 },
  phone: { type: String, default: '', maxlength: 30 },
  address: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  avatar_public_id: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.avatar_public_id;
  return obj;
};

export default mongoose.model('User', userSchema);
