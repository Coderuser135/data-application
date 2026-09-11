import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, default: 0 },
  sale_price: { type: Number, default: null },
  stock_quantity: { type: Number, default: 0 },
  image_url: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ category_id: 1 });
productSchema.index({ is_active: 1 });

export default mongoose.model('Product', productSchema);
