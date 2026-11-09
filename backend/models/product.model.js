import mongoose from 'mongoose';

const supplementImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  alt_text: { type: String, trim: true, maxlength: 160, default: '' },
  is_primary: { type: Boolean, default: false },
}, { _id: true });

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, trim: true },
  sku: { type: String, unique: true, sparse: true, uppercase: true, trim: true, maxlength: 60 },
  brand: { type: String, required: true, trim: true, maxlength: 120, default: 'Unbranded' },
  description: { type: String, default: '', maxlength: 5000 },
  net_quantity: { type: String, trim: true, maxlength: 80, default: '' },
  expiry_date: { type: Date, default: null },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, default: null, min: 0 },
  cost_price: { type: Number, default: null, min: 0 },
  stock_quantity: { type: Number, default: 0, min: 0 },
  reserved_quantity: { type: Number, default: 0, min: 0 },
  low_stock_threshold: { type: Number, default: 5, min: 0 },
  images: { type: [supplementImageSchema], default: [] },
  image_url: { type: String, default: '' },
  image_public_id: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  // Retained for the storefront's existing featured-first ordering.
  is_featured: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('available_quantity').get(function() {
  return Math.max(0, this.stock_quantity - this.reserved_quantity);
});

productSchema.virtual('stock_status').get(function() {
  const available = Math.max(0, this.stock_quantity - this.reserved_quantity);
  if (available <= 0) return 'out_of_stock';
  if (available <= this.low_stock_threshold) return 'low_stock';
  return 'in_stock';
});

productSchema.pre('validate', function(next) {
  if (!this.sku && this._id) this.sku = `SUP-${String(this._id).slice(-8).toUpperCase()}`;
  if (this.mrp != null && this.price > this.mrp) {
    return next(new Error('Selling price cannot be greater than MRP'));
  }
  if (this.reserved_quantity > this.stock_quantity) {
    return next(new Error('Reserved stock cannot exceed physical stock'));
  }
  next();
});

productSchema.index({ category_id: 1, is_active: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ name: 'text', brand: 'text', sku: 'text' });
productSchema.index({ is_active: 1, is_deleted: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);
