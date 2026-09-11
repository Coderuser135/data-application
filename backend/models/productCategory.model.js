import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('ProductCategory', productCategorySchema);
