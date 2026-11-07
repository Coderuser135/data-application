import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  movement_type: {
    type: String,
    enum: ['opening_stock', 'stock_in', 'stock_out', 'adjustment', 'order_reserved', 'order_sale', 'order_release', 'offline_sale'],
    required: true,
  },
  quantity: { type: Number, required: true },
  stock_before: { type: Number, required: true, min: 0 },
  stock_after: { type: Number, required: true, min: 0 },
  reserved_before: { type: Number, default: 0, min: 0 },
  reserved_after: { type: Number, default: 0, min: 0 },
  reason: { type: String, trim: true, maxlength: 300, default: '' },
  reference_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

inventoryMovementSchema.index({ product_id: 1, createdAt: -1 });
export default mongoose.model('InventoryMovement', inventoryMovementSchema);
