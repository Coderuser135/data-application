import mongoose from 'mongoose';

const offlineSaleItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name_snapshot: { type: String, required: true, trim: true },
  product_sku_snapshot: { type: String, default: '' },
  product_price_snapshot: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const offlineSaleSchema = new mongoose.Schema({
  bill_number: { type: String, required: true, unique: true, trim: true },
  customer_name: { type: String, trim: true, maxlength: 120, default: '' },
  customer_phone: { type: String, trim: true, maxlength: 20, default: '' },
  payment_method: { type: String, enum: ['cash', 'upi', 'card', 'other'], required: true, default: 'cash' },
  items: { type: [offlineSaleItemSchema], required: true, validate: (items) => items.length > 0 },
  total_amount: { type: Number, required: true, min: 0 },
  sold_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

offlineSaleSchema.index({ createdAt: -1 });
export default mongoose.model('OfflineSale', offlineSaleSchema);
