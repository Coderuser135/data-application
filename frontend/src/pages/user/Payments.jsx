import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { fetchMyPayments } from '@/redux/slices/paymentSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function Payments() {
  const dispatch = useDispatch();
  const payments = useSelector((state) => state.payments.items);
  const loading = useSelector((state) => state.payments.loading);

  useEffect(() => { dispatch(fetchMyPayments()); }, [dispatch]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  const totalPaid = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Payments</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-xs text-surface-500">Total paid</p><p className="mt-2 font-display text-2xl font-bold text-brand-600">{formatCurrency(totalPaid)}</p></Card>
        <Card><p className="text-xs text-surface-500">Total transactions</p><p className="mt-2 font-display text-2xl font-bold">{payments.length}</p></Card>
        <Card><p className="text-xs text-surface-500">Successful</p><p className="mt-2 font-display text-2xl font-bold">{payments.filter((p) => p.status === 'success').length}</p></Card>
      </div>
      <Card>
        <h3 className="mb-4 font-display text-lg font-semibold text-ink-950 dark:text-white">Transaction History</h3>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                <th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Method</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="py-3">{formatDate(p.payment_date)}</td>
                    <td className="py-3 capitalize">{p.payment_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 capitalize">{p.payment_method}</td>
                    <td className="py-3 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="py-3"><Badge tone={p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No payments yet" />}
      </Card>
    </div>
  );
}
