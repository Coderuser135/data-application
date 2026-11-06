import mongoose from 'mongoose';
const supplementImageSchema = new mongoose.Schema({
  url: { type: String, required: true }, public_id: { type: String, required: true },
  alt_text: { type: String, trim: true, maxlength: 160, default: '' }, is_primary: { type: Boolean, default: false },
}, { _id: true });
const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, trim: true },
  sku: { type: String, unique: true, sparse: true, uppercase: true, trim: true, maxlength: 60 },
  barcode: { type: String, trim: true, default: '', maxlength: 80 },
  brand: { type: String, required: true, trim: true, maxlength: 120, default: 'Unbranded' },
  product_type: { type: String, enum: ['protein', 'vitamin', 'mineral', 'hydration', 'nutrition_bar', 'other'], default: 'other' },
  description: { type: String, default: '', maxlength: 5000 },
  key_features: [{ type: String, trim: true, maxlength: 180 }],
  net_quantity: { type: String, trim: true, maxlength: 80, default: '' },
  serving_information: { type: String, trim: true, maxlength: 300, default: '' },
  ingredients: { type: String, trim: true, maxlength: 3000, default: '' },
  allergen_information: { type: String, trim: true, maxlength: 1000, default: '' },
  manufacturer: { type: String, trim: true, maxlength: 180, default: '' },
  country_of_origin: { type: String, trim: true, maxlength: 100, default: 'India' },
  fssai_license_number: { type: String, trim: true, maxlength: 80, default: '' },
  batch_number: { type: String, trim: true, maxlength: 80, default: '' },
  manufacturing_date: { type: Date, default: null }, expiry_date: { type: Date, default: null },
  storage_instructions: { type: String, trim: true, maxlength: 500, default: '' },
  price: { type: Number, required: true, min: 0 }, sale_price: { type: Number, default: null, min: 0 },
  mrp: { type: Number, default: null, min: 0 }, cost_price: { type: Number, default: null, min: 0 },
  tax_rate: { type: Number, default: 0, min: 0, max: 100 },
  stock_quantity: { type: Number, default: 0, min: 0 }, reserved_quantity: { type: Number, default: 0, min: 0 },
  low_stock_threshold: { type: Number, default: 5, min: 0 },
  images: { type: [supplementImageSchema], default: [] },
  image_url: { type: String, default: '' }, image_public_id: { type: String, default: '' },
  is_active: { type: Boolean, default: true }, is_featured: { type: Boolean, default: false }, is_deleted: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
productSchema.virtual('available_quantity').get(function() { return Math.max(0, this.stock_quantity - this.reserved_quantity); });
productSchema.virtual('stock_status').get(function() {
  const available = Math.max(0, this.stock_quantity - this.reserved_quantity);
  if (available <= 0) return 'out_of_stock';
  if (available <= this.low_stock_threshold) return 'low_stock';
  return 'in_stock';
});
productSchema.pre('validate', function(next) {\n  if (!this.sku && this._id) this.sku = `SUP-${String(this._id).slice(-8).toUpperCase()}`;
  if (this.sale_price != null && this.sale_price > this.price) return next(new Error('Sale price cannot be greater than selling price'));
  if (this.mrp != null && this.price > this.mrp) return next(new Error('Selling price cannot be greater than MRP'));
  if (this.reserved_quantity > this.stock_quantity) return next(new Error('Reserved stock cannot exceed physical stock'));
  if (this.manufacturing_date && this.expiry_date && this.expiry_date <= this.manufacturing_date) return next(new Error('Expiry date must be after manufacturing date'));
  next();
});
productSchema.index({ category_id: 1, is_active: 1 }); productSchema.index({ brand: 1 });
productSchema.index({ name: 'text', brand: 'text', sku: 'text' });
productSchema.index({ is_active: 1, is_deleted: 1, createdAt: -1 });
export default mongoose.model('Product', productSchema);
