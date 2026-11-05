import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { membershipService } from '@/services/membershipService';
import { formatCurrency, formatDate, getDaysRemaining } from '@/utils/formatters';

const tone = { active: 'success', pending: 'warning', expired: 'neutral', cancelled: 'danger', not_purchased: 'neutral' };

export default function AdminMemberships() {
  const dispatch = useDispatch();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    membershipService.getAll()
      .then((data) => setMemberships(data || []))
      .catch(() => setLoadError('Membership records could not be loaded. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoadingSkeleton variant="table" rows={6} />;
  if (loadError) return <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-surface-900 dark:text-red-300">{loadError}</div>;

  const active = memberships.filter((m) => m.status === 'active').length;
  const expired = memberships.filter((m) => m.status === 'expired').length;
  const pending = memberships.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Memberships</h1>
        <p className="mt-1 text-sm text-surface-500">All gym membership records</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs text-surface-500">Active</p><p className="mt-1 font-display text-2xl font-bold text-emerald-500">{active}</p></Card>
        <Card><p className="text-xs text-surface-500">Pending</p><p className="mt-1 font-display text-2xl font-bold text-amber-500">{pending}</p></Card>
        <Card><p className="text-xs text-surface-500">Expired</p><p className="mt-1 font-display text-2xl font-bold text-surface-400">{expired}</p></Card>
      </div>

      {memberships.length > 0 ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                <th className="px-5 py-4 font-medium">Member</th><th className="px-5 py-4 font-medium">Plan</th><th className="px-5 py-4 font-medium">Price</th><th className="px-5 py-4 font-medium">Start</th><th className="px-5 py-4 font-medium">End</th><th className="px-5 py-4 font-medium">Days Left</th><th className="px-5 py-4 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-4 font-medium text-ink-900 dark:text-white">{m.user_id?.full_name || '—'}</td>
                    <td className="px-5 py-4">{m.plan_name_snapshot}</td>
                    <td className="px-5 py-4">{formatCurrency(m.plan_price_snapshot)}</td>
                    <td className="px-5 py-4">{formatDate(m.start_date)}</td>
                    <td className="px-5 py-4">{formatDate(m.end_date)}</td>
                    <td className="px-5 py-4">{m.status === 'active' ? getDaysRemaining(m.end_date) : '—'}</td>
                    <td className="px-5 py-4"><Badge tone={tone[m.status] || 'neutral'}>{m.status.replace(/_/g, ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : <EmptyState title="No memberships yet" />}
    </div>
  );
}
