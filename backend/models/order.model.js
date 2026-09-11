import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name_snapshot: { type: String, required: true },
  product_price_snapshot: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  subtotal: { type: Number, required: true, default: 0 },
}, { _id: true, timestamps: true });

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_number: { type: String, required: true, unique: true },
  total_amount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shipping_address: { type: String, default: '' },
  payment_status: { type: String, default: 'pending' },
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  order_items: [orderItemSchema],
}, { timestamps: true });

orderSchema.index({ user_id: 1 });
orderSchema.index({ status: 1 });

export default mongoose.model('Order', orderSchema);
