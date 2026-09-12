import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

productCategorySchema.index({ is_active: 1, name: 1 });

export default mongoose.model('ProductCategory', productCategorySchema);
