import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Package } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '@/redux/slices/cartSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatters';

function getProductId(product) {
  return product.id || product._id;
}

function getProductImage(product) {
  return product.image_url || product.images?.find((image) => image.is_primary)?.url || product.images?.[0]?.url || '';
}

export default function Cart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce((sum, item) => {
    const price = Number(item.product.price || item.product.sale_price || 0);
    return sum + price * item.quantity;
  }, 0);

  if (items.length === 0) return <div className="space-y-6"><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Your Cart</h1><EmptyState title="Your cart is empty" description="Browse the store and add supplements to your cart." /><Link to="/user/store"><Button>Shop supplements</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Your Cart</h1><p className="mt-1 text-sm text-surface-500">{items.reduce((sum, item) => sum + item.quantity, 0)} items in your bag</p></div>
        <Link to="/user/store" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">Continue shopping</Link>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3">
          {items.map((item) => {
            const product = item.product;
            const id = getProductId(product);
            const image = getProductImage(product);
            const price = Number(product.price || product.sale_price || 0);
            return (
              <Card key={id} className="min-w-0 overflow-hidden">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-100 dark:bg-surface-800 sm:h-24 sm:w-24">
                      {image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-2" /> : <Package size={30} className="text-surface-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {product.brand && <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{product.brand}</p>}
                      <h3 className="break-words font-semibold text-ink-950 dark:text-white">{product.name}</h3>
                      {product.net_quantity && <p className="mt-1 text-xs text-surface-500">{product.net_quantity}</p>}
                      <p className="mt-1 text-sm font-semibold text-surface-600 dark:text-surface-300">{formatCurrency(price)} <span className="font-normal text-surface-400">/ item</span></p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-800 sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-2 rounded-lg border border-surface-200 p-1 dark:border-surface-700">
                      <button aria-label={`Decrease ${product.name} quantity`} onClick={() => dispatch(updateQuantity({ id, quantity: item.quantity - 1 }))} className="rounded-md p-1.5 transition hover:bg-surface-100 dark:hover:bg-surface-800"><Minus size={15} /></button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button aria-label={`Increase ${product.name} quantity`} onClick={() => dispatch(updateQuantity({ id, quantity: item.quantity + 1 }))} className="rounded-md p-1.5 transition hover:bg-surface-100 dark:hover:bg-surface-800"><Plus size={15} /></button>
                    </div>
                    <p className="min-w-[76px] text-right font-display text-base font-bold text-ink-950 dark:text-white">{formatCurrency(price * item.quantity)}</p>
                    <button aria-label={`Remove ${product.name} from cart`} onClick={() => dispatch(removeFromCart(id))} className="rounded-lg p-2 text-surface-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={18} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="min-w-0">
          <Card className="lg:sticky lg:top-5">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Order Summary</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Items</span><span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Subtotal</span><span className="font-medium">{formatCurrency(total)}</span></div>
              <div className="flex justify-between border-t border-surface-200 pt-3 dark:border-surface-800"><span className="font-semibold">Total</span><span className="font-display text-xl font-bold text-brand-600">{formatCurrency(total)}</span></div>
            </div>
            <Link to="/user/checkout" className="block"><Button className="mt-5 w-full" size="lg">Proceed to checkout</Button></Link>
            <button onClick={() => dispatch(clearCart())} className="mt-3 w-full text-sm text-surface-500 hover:text-red-600">Clear cart</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
