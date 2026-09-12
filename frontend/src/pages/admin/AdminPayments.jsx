import { useEffect, useState } from 'react';
import { IndianRupee, Dumbbell, Store, TrendingUp, RotateCcw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { fetchAllPayments } from '@/redux/slices/paymentSlice';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminPayments() {
  const dispatch = useDispatch();
  const { adminItems, loading } = useSelector((state) => state.payments);
  const [refunding, setRefunding] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { dispatch(fetchAllPayments()); }, [dispatch]);

  const payments = adminItems || [];
  const gymRevenue = payments.filter((p) => p.status === 'success' && p.payment_type !== 'order').reduce((sum, p) => sum + Number(p.amount), 0);
  const storeRevenue = payments.filter((p) => p.status === 'success' && p.payment_type === 'order').reduce((sum, p) => sum + Number(p.amount), 0);
  const refunded = payments.filter((p) => p.status === 'refunded').reduce((sum, p) => sum + Number(p.refunded_amount || p.amount), 0);
  const pending = payments.filter((p) => p.status === 'pending');

  async function handleRefund(payment) {
    if (!window.confirm(`Refund ${formatCurrency(payment.amount)} to ${payment.user_id?.full_name || 'this customer'}?`)) return;
    setRefunding(payment.id); setError('');
    try {
      await paymentService.refund(payment.id, { note: 'Refund issued by gym admin' });
      dispatch(fetchAllPayments());
    } catch (err) {
      setError(err?.message || 'Refund failed');
    } finally { setRefunding(''); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Payments</h1><p className="mt-1 text-sm text-surface-500">All payment transactions</p></div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Dumbbell size={20} /></span><p className="mt-4 text-xs text-surface-500">Gym Revenue</p><p className="mt-1 font-display text-2xl font-bold">{formatCurrency(gymRevenue)}</p></Card>
        <Card><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Store size={20} /></span><p className="mt-4 text-xs text-surface-500">Store Revenue</p><p className="mt-1 font-display text-2xl font-bold">{formatCurrency(storeRevenue)}</p></Card>
        <Card><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><IndianRupee size={20} /></span><p className="mt-4 text-xs text-surface-500">Gross Revenue</p><p className="mt-1 font-display text-2xl font-bold">{formatCurrency(gymRevenue + storeRevenue)}</p></Card>
        <Card><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><TrendingUp size={20} /></span><p className="mt-4 text-xs text-surface-500">Pending</p><p className="mt-1 font-display text-2xl font-bold">{pending.length}</p></Card>
        <Card><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-100 text-surface-500"><RotateCcw size={20} /></span><p className="mt-4 text-xs text-surface-500">Refunded</p><p className="mt-1 font-display text-2xl font-bold">{formatCurrency(refunded)}</p></Card>
      </div>

      {payments.length > 0 ? <Card padding={false}>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800"><th className="px-5 py-4 font-medium">Transaction ID</th><th className="px-5 py-4 font-medium">Customer</th><th className="px-5 py-4 font-medium">Type</th><th className="px-5 py-4 font-medium">Method</th><th className="px-5 py-4 font-medium">Amount</th><th className="px-5 py-4 font-medium">Date</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium text-right">Action</th></tr></thead>
          <tbody>{payments.map((p) => <tr key={p.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800"><td className="px-5 py-4 font-mono text-xs">{p.transaction_id || p.razorpay_payment_id || '—'}</td><td className="px-5 py-4 text-surface-600 dark:text-surface-300">{p.user_id?.full_name || '—'}</td><td className="px-5 py-4 capitalize">{p.payment_type?.replace(/_/g, ' ') || '—'}</td><td className="px-5 py-4 capitalize">{p.payment_method || '—'}</td><td className="px-5 py-4 font-semibold">{formatCurrency(p.amount)}</td><td className="px-5 py-4 text-surface-500">{formatDate(p.payment_date || p.created_at)}</td><td className="px-5 py-4"><Badge tone={p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : p.status === 'refunded' ? 'neutral' : 'danger'}>{p.status}</Badge></td><td className="px-5 py-4 text-right">{p.status === 'success' && p.payment_method === 'online' && p.razorpay_payment_id ? <Button size="sm" variant="outline" loading={refunding === p.id} onClick={() => handleRefund(p)}>Refund</Button> : '—'}</td></tr>)}</tbody>
        </table></div>
      </Card> : !loading ? <EmptyState title="No payments yet" /> : null}
    </div>
  );
}
