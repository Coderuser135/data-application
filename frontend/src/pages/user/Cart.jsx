import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '@/redux/slices/cartSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatters';

export default function Cart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce((sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity, 0);

  if (items.length === 0) return <div className="space-y-6"><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Your Cart</h1><EmptyState title="Your cart is empty" description="Browse the store and add supplements to your cart." /><Link to="/user/store"><Button>Shop supplements</Button></Link></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Your Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.product.id} className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-brand-500 dark:bg-surface-800"><ShoppingBag size={24} /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink-950 dark:text-white">{item.product.name}</h3>
                <p className="text-sm text-surface-500">{formatCurrency(item.product.sale_price || item.product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => dispatch(updateQuantity({ id: item.product.id, quantity: item.quantity - 1 }))} className="rounded-lg p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"><Minus size={16} /></button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => dispatch(updateQuantity({ id: item.product.id, quantity: item.quantity + 1 }))} className="rounded-lg p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"><Plus size={16} /></button>
              </div>
              <p className="w-20 text-right font-semibold">{formatCurrency((item.product.sale_price || item.product.price) * item.quantity)}</p>
              <button onClick={() => dispatch(removeFromCart(item.product.id))} className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={18} /></button>
            </Card>
          ))}
        </div>
        <Card>
          <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Order Summary</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-surface-500">Items</span><span className="font-medium">{items.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">Subtotal</span><span className="font-medium">{formatCurrency(total)}</span></div>
            <div className="flex justify-between border-t border-surface-200 pt-3 dark:border-surface-800"><span className="font-semibold">Total</span><span className="font-display text-xl font-bold text-brand-600">{formatCurrency(total)}</span></div>
          </div>
          <Link to="/user/checkout"><Button className="mt-5 w-full" size="lg">Proceed to checkout</Button></Link>
          <button onClick={() => dispatch(clearCart())} className="mt-3 w-full text-sm text-surface-500 hover:text-red-600">Clear cart</button>
        </Card>
      </div>
    </div>
  );
}
