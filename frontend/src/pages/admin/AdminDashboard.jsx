import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Dumbbell, CreditCard, Package, TrendingUp, IndianRupee, ShoppingCart, AlertTriangle, Calendar, ArrowRight, Activity, Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchAdminStats, fetchRevenueAnalytics } from '@/redux/slices/dashboardSlice';
import { formatCurrency, formatDate, getDaysRemaining } from '@/utils/formatters';

const periods = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1Y' },
];

function StatCard({ icon: Icon, label, value, tone = 'neutral', sublabel }) {
  const tones = {
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-blue-500/10 text-blue-400',
    neutral: 'bg-surface-700 text-surface-300',
  };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={20} /></span>
        {sublabel && <span className="text-xs text-surface-500">{sublabel}</span>}
      </div>
      <p className="mt-4 text-xs font-medium text-surface-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-950 dark:text-white">{value}</p>
    </Card>
  );
}

function RevenueChart({ analytics, period, onPeriodChange }) {
  const allDates = [...(analytics?.gymRevenue || []), ...(analytics?.storeRevenue || [])].map((d) => d.date);
  const uniqueDates = [...new Set(allDates)].sort();
  const maxAmount = Math.max(1, ...[...(analytics?.gymRevenue || []), ...(analytics?.storeRevenue || [])].map((d) => d.amount));

  function getAmount(arr, date) {
    return arr.find((d) => d.date === date)?.amount || 0;
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-brand-500" />
          <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Revenue Analytics</h3>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
          {periods.map((p) => (
            <button key={p.key} onClick={() => onPeriodChange(p.key)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${period === p.key ? 'bg-brand-600 text-white' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="mb-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand-600" /> Gym Revenue</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-blue-500" /> Store Revenue</span>
      </div>
      {uniqueDates.length > 0 ? (
        <div className="flex items-end gap-1 overflow-x-auto" style={{ minHeight: '180px' }}>
          {uniqueDates.map((date) => {
            const gym = getAmount(analytics.gymRevenue, date);
            const store = getAmount(analytics.storeRevenue, date);
            const gymH = (gym / maxAmount) * 160;
            const storeH = (store / maxAmount) * 160;
            return (
              <div key={date} className="flex min-w-[40px] flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: '160px' }}>
                  <div className="w-3 rounded-t bg-brand-600 transition-all duration-300" style={{ height: `${Math.max(2, gymH)}px` }} title={`Gym: ${formatCurrency(gym)}`} />
                  <div className="w-3 rounded-t bg-blue-500 transition-all duration-300" style={{ height: `${Math.max(2, storeH)}px` }} title={`Store: ${formatCurrency(store)}`} />
                </div>
                <span className="text-[10px] text-surface-500">{date.slice(-5)}</span>
              </div>
            );
          })}
        </div>
      ) : <p className="py-8 text-center text-sm text-surface-500">No revenue data for this period</p>}
    </Card>
  );
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const adminStats = useSelector((state) => state.dashboard.adminStats);
  const analytics = useSelector((state) => state.dashboard.analytics);
  const loading = useSelector((state) => state.dashboard.loading);
  const [period, setPeriod] = useState('30d');

  useEffect(() => { dispatch(fetchAdminStats()); }, [dispatch]);
  useEffect(() => { dispatch(fetchRevenueAnalytics(period)); }, [dispatch, period]);

  if (loading && !adminStats) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  if (!adminStats) return <EmptyState title="Failed to load dashboard" />;

  const s = adminStats.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-surface-500">Business overview and analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={s.totalUsers} tone="info" />
        <StatCard icon={Dumbbell} label="Gym Members" value={s.totalAdmitted} tone="success" sublabel={`${s.notAdmitted} not admitted`} />
        <StatCard icon={CreditCard} label="Active Memberships" value={s.activeMemberships} tone="success" sublabel={`${s.expiredMemberships} expired`} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={s.totalOrders} tone="neutral" sublabel={`${s.pendingOrders} pending`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Gym Revenue" value={formatCurrency(s.gymRevenue)} tone="danger" />
        <StatCard icon={Store} label="Store Revenue" value={formatCurrency(s.storeRevenue)} tone="info" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={formatCurrency(s.totalRevenue)} tone="success" />
        <StatCard icon={TrendingUp} label="This Month" value={formatCurrency(s.monthRevenue)} tone="success" sublabel={`Today: ${formatCurrency(s.todayRevenue)}`} />
      </div>

      <RevenueChart analytics={analytics} period={period} onPeriodChange={setPeriod} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Recent Orders</h3>
            <Link to="/admin/orders"><Button variant="ghost" size="sm">View All <ArrowRight size={14} /></Button></Link>
          </div>
          <div className="p-5">
            {adminStats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {adminStats.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-white">{o.order_number}</p>
                      <p className="text-xs text-surface-500">{o.user_id?.full_name || '—'} · {formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(o.total_amount)}</p>
                      <Badge tone={o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'warning' : 'info'}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No orders yet" />}
          </div>
        </Card>

        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Expiring Memberships</h3>
            <Link to="/admin/memberships"><Button variant="ghost" size="sm">View All <ArrowRight size={14} /></Button></Link>
          </div>
          <div className="p-5">
            {adminStats.expiringMemberships.length > 0 ? (
              <div className="space-y-3">
                {adminStats.expiringMemberships.map((m) => {
                  const days = getDaysRemaining(m.end_date);
                  return (
                    <div key={m.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                      <div>
                        <p className="text-sm font-medium text-ink-900 dark:text-white">{m.user_id?.full_name || '—'}</p>
                        <p className="text-xs text-surface-500">{m.plan_name_snapshot} · {formatDate(m.end_date)}</p>
                      </div>
                      <Badge tone={days <= 1 ? 'danger' : 'warning'}>{days} days left</Badge>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState title="No expiring memberships" />}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-950 dark:text-white"><AlertTriangle size={18} className="text-amber-500" /> Low Stock</h3>
            <Link to="/admin/products"><Button variant="ghost" size="sm">View Products <ArrowRight size={14} /></Button></Link>
          </div>
          <div className="p-5">
            {adminStats.lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {adminStats.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                    <p className="text-sm font-medium text-ink-900 dark:text-white">{p.name}</p>
                    <Badge tone={p.stock_quantity === 0 ? 'danger' : 'warning'}>{p.stock_quantity} left</Badge>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="All products well stocked" />}
          </div>
        </Card>

        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Recent Payments</h3>
            <Link to="/admin/payments"><Button variant="ghost" size="sm">View All <ArrowRight size={14} /></Button></Link>
          </div>
          <div className="p-5">
            {adminStats.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {adminStats.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                    <div>
                      <p className="text-sm font-medium capitalize text-ink-900 dark:text-white">{p.payment_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-surface-500">{p.user_id?.full_name || '—'} · {formatDate(p.payment_date || p.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                      <Badge tone={p.status === 'success' ? 'success' : 'warning'}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No payments yet" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
