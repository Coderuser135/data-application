import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import OfflineSale from '../models/offlineSale.model.js';
import InventoryMovement from '../models/inventoryMovement.model.js';
import { ApiError } from '../utils/errors.utils.js';

function createBillNumber() {
  const stamp = Date.now().toString().slice(-8);
  const random = String(Math.floor(Math.random() * 900) + 100);
  return `HG-OFF-${stamp}-${random}`;
}

export async function createOfflineSale({ items, customerName = '', customerPhone = '', paymentMethod = 'cash', performedBy }) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Select at least one supplement');
  if (!['cash', 'upi', 'card', 'other'].includes(paymentMethod)) throw new ApiError(400, 'Choose a valid payment method');

  const quantities = new Map();
  for (const item of items) {
    const productId = String(item.productId || item.product_id || '');
    const quantity = Number(item.quantity);
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new ApiError(400, 'Each selected supplement must have a valid quantity');
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const decremented = [];
  let sale;
  try {
    const saleItems = [];
    let totalAmount = 0;

    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          is_active: true,
          is_deleted: { $ne: true },
          $expr: { $gte: [{ $subtract: ['$stock_quantity', '$reserved_quantity'] }, quantity] },
        },
        { $inc: { stock_quantity: -quantity } },
        { new: false },
      );
      if (!product) throw new ApiError(409, 'A selected supplement is unavailable or has insufficient stock. Refresh the store and try again.');

      decremented.push({ productId, quantity });
      const subtotal = Number(product.price) * quantity;
      totalAmount += subtotal;
      saleItems.push({
        product_id: product._id,
        product_name_snapshot: product.name,
        product_sku_snapshot: product.sku || '',
        product_price_snapshot: product.price,
        quantity,
        subtotal,
      });
    }

    sale = await OfflineSale.create({
      bill_number: createBillNumber(),
      customer_name: String(customerName).trim().slice(0, 120),
      customer_phone: String(customerPhone).trim().slice(0, 20),
      payment_method: paymentMethod,
      items: saleItems,
      total_amount: totalAmount,
      sold_by: performedBy || null,
    });

    for (const item of saleItems) {
      const after = await Product.findById(item.product_id).select('stock_quantity reserved_quantity');
      await InventoryMovement.create({
        product_id: item.product_id,
        movement_type: 'offline_sale',
        quantity: -item.quantity,
        stock_before: after.stock_quantity + item.quantity,
        stock_after: after.stock_quantity,
        reserved_before: after.reserved_quantity,
        reserved_after: after.reserved_quantity,
        reason: `Offline counter sale ${sale.bill_number}`,
        reference_id: sale._id,
        performed_by: performedBy || null,
      });
    }

    return sale;
  } catch (error) {
    if (sale?._id) {
      await InventoryMovement.deleteMany({ reference_id: sale._id }).catch(() => {});
      await OfflineSale.deleteOne({ _id: sale._id }).catch(() => {});
    }
    await Promise.all(decremented.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock_quantity: quantity } }).catch(() => null)
    ));
    throw error;
  }
}
