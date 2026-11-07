import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  section: { type: String, enum: ['gym', 'store'], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', trim: true, maxlength: 240 },
  image_url: { type: String, required: true },
  image_public_id: { type: String, required: true },
  button_text: { type: String, default: '', trim: true, maxlength: 30 },
  button_link: { type: String, default: '', trim: true, maxlength: 500 },
  sort_order: { type: Number, default: 0, min: 0 },
  is_active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

bannerSchema.index({ section: 1, is_active: 1, sort_order: 1, createdAt: -1 });

export default mongoose.model('Banner', bannerSchema);
