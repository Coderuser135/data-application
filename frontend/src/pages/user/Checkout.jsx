import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, CreditCard, Lock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { clearCart } from '@/redux/slices/cartSlice';
import { createOrder } from '@/redux/slices/orderSlice';
import { paymentService } from '@/services/paymentService';
import { formatCurrency } from '@/utils/formatters';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((sum, item) => sum + (item.product.sale_price ?? item.product.price) * item.quantity, 0);

  function update(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  function validate() {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) return 'Valid 10-digit phone number is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!/^\d{6}$/.test(form.pincode.trim())) return 'Valid 6-digit pincode is required';
    return null;
  }

  async function handleCheckout(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      const shippingAddress = `${form.full_name}, ${form.address}, ${form.city}, ${form.state} - ${form.pincode}, Phone: ${form.phone}`;
      const order = await dispatch(createOrder({ items, shippingAddress })).unwrap();
      const { payment, keyId, razorpayOrder } = await paymentService.createRazorpayOrder({ orderId: order.id });

      if (!razorpayOrder || !keyId || typeof window.Razorpay !== 'function') {
        throw new Error('Online payment is temporarily unavailable. Your order is saved as pending; please try again from your orders.');
      }

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'IronForge Store',
          description: `Order ${order.order_number}`,
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              await paymentService.verifyRazorpayPayment(response);
              resolve();
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled. Your order remains pending and the cart was kept.')) },
        });
        rzp.on('payment.failed', (response) => reject(new Error(response?.error?.description || 'Payment failed')));
        rzp.open();
      });

      dispatch(clearCart());
      setSuccess(true);
      setTimeout(() => navigate('/user/orders'), 1200);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || 'Checkout failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <CheckCircle2 size={64} className="text-brand-500" />
      <h2 className="mt-4 font-display text-2xl font-bold text-ink-950 dark:text-white">Payment successful!</h2>
      <p className="mt-2 text-surface-500">Your order has been confirmed. Redirecting to your orders...</p>
    </div>
  );

  if (items.length === 0) return <div className="py-20 text-center"><p className="text-surface-500">Your cart is empty.</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-950 dark:text-white">Shipping Address</h3>
          <form onSubmit={handleCheckout} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Your name" required />
              <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))} placeholder="10-digit phone" maxLength={10} required />
            </div>
            <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House no, Street, Area" required />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" required />
              <Input label="State" value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="State" required />
              <Input label="Pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))} placeholder="6-digit PIN" maxLength={6} required />
            </div>
            <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-brand-600" />
                <p className="text-sm font-semibold text-ink-900 dark:text-white">Secure Payment</p>
              </div>
              <p className="mt-1 text-xs text-surface-500">Online payment via Razorpay. Payment details are verified on the server.</p>
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full"><CreditCard size={18} /> Pay {formatCurrency(total)}</Button>
          </form>
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-950 dark:text-white">Order Summary</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-surface-600 dark:text-surface-300">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency((item.product.sale_price ?? item.product.price) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-surface-200 pt-3 dark:border-surface-800">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-brand-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
