import { useEffect, useState } from 'react';
import { IndianRupee, Dumbbell, Store, TrendingUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { fetchAllPayments } from '@/redux/slices/paymentSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminPayments() {
  const dispatch = useDispatch();
  const { adminItems, loading } = useSelector((state) => state.payments);

  useEffect(() => { dispatch(fetchAllPayments()); }, [dispatch]);

  const payments = adminItems || [];
  const gymRevenue = payments.filter((p) => p.status === 'success' && p.payment_type !== 'order').reduce((sum, p) => sum + Number(p.amount), 0);
  const storeRevenue = payments.filter((p) => p.status === 'success' && p.payment_type === 'order').reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Payments</h1>
        <p className="mt-1 text-sm text-surface-500">All payment transactions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Dumbbell size={20} /></span>
          </div>
          <p className="mt-4 text-xs text-surface-500">Gym Revenue</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-950 dark:text-white">{formatCurrency(gymRevenue)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Store size={20} /></span>
          </div>
          <p className="mt-4 text-xs text-surface-500">Store Revenue</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-950 dark:text-white">{formatCurrency(storeRevenue)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><IndianRupee size={20} /></span>
          </div>
          <p className="mt-4 text-xs text-surface-500">Total Revenue</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-950 dark:text-white">{formatCurrency(gymRevenue + storeRevenue)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><TrendingUp size={20} /></span>
          </div>
          <p className="mt-4 text-xs text-surface-500">Pending</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-950 dark:text-white">{pending.length}</p>
        </Card>
      </div>

      {payments.length > 0 ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-4 font-medium">Transaction ID</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Method</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-4 font-mono text-xs">{p.transaction_id || p.razorpay_payment_id || '—'}</td>
                    <td className="px-5 py-4 text-surface-600 dark:text-surface-300">{p.user_id?.full_name || '—'}</td>
                    <td className="px-5 py-4 capitalize">{p.payment_type?.replace(/_/g, ' ') || '—'}</td>
                    <td className="px-5 py-4 capitalize">{p.payment_method || '—'}</td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-4 text-surface-500">{formatDate(p.payment_date || p.created_at)}</td>
                    <td className="px-5 py-4"><Badge tone={p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : !loading ? <EmptyState title="No payments yet" /> : null}
    </div>
  );
}
