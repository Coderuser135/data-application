import mongoose from 'mongoose';
const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name_snapshot: { type: String, required: true }, product_price_snapshot: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 100 }, subtotal: { type: Number, required: true, min: 0 },
}, { _id: true, timestamps: true });
const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, order_number: { type: String, required: true, unique: true },
  total_amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shipping_address: { type: String, required: true, trim: true, maxlength: 1000 },
  payment_status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  inventory_status: { type: String, enum: ['legacy', 'reserved', 'committed', 'released'], default: 'legacy' },
  reservation_expires_at: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) },
  order_items: { type: [orderItemSchema], validate: { validator: (items) => items.length > 0, message: 'Order must contain at least one item' } },
}, { timestamps: true });
orderSchema.index({ user_id: 1, createdAt: -1 }); orderSchema.index({ status: 1, payment_status: 1 });
orderSchema.index({ inventory_status: 1, reservation_expires_at: 1 });
export default mongoose.model('Order', orderSchema);
