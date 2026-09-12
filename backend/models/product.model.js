import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '', maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  sale_price: { type: Number, default: null, min: 0 },
  stock_quantity: { type: Number, default: 0, min: 0 },
  image_url: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.pre('validate', function(next) {
  if (this.sale_price != null && this.sale_price > this.price) {
    return next(new Error('Sale price cannot be greater than regular price'));
  }
  next();
});

productSchema.index({ category_id: 1 });
productSchema.index({ is_active: 1 });

export default mongoose.model('Product', productSchema);
