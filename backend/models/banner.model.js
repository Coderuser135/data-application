import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  section: { type: String, enum: ['gym', 'store'], required: true, index: true },
  image_url: { type: String, required: true },
  image_public_id: { type: String, required: true },
  is_active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

bannerSchema.index({ section: 1, is_active: 1, createdAt: -1 });

export default mongoose.model('Banner', bannerSchema);
