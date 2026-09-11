import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, Ruler, ShoppingBag, ArrowRight, Dumbbell, TrendingUp, TrendingDown, AlertCircle, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchUserDashboard } from '@/redux/slices/dashboardSlice';
import { formatCurrency, formatDate, getDaysRemaining } from '@/utils/formatters';

function MiniTrendChart({ measurements }) {
  const sorted = [...measurements].reverse().slice(-6);
  if (sorted.length < 2) return null;
  const weights = sorted.map((m) => Number(m.weight) || 0);
  const max = Math.max(...weights, 1);
  const min = Math.min(...weights, 0);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-2" style={{ height: '80px' }}>
      {sorted.map((m, i) => {
        const h = ((Number(m.weight) - min) / range) * 60 + 20;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-surface-500">{Number(m.weight) || '—'}</span>
            <div className="w-full rounded-t bg-brand-600/80" style={{ height: `${h}px` }} />
            <span className="text-[10px] text-surface-500">{formatDate(m.measurement_date).split(' ')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function UserDashboard() {
  const profile = useSelector((state) => state.auth.profile);
  const dispatch = useDispatch();
  const data = useSelector((state) => state.dashboard.userData);
  const loading = useSelector((state) => state.dashboard.loading);

  useEffect(() => { dispatch(fetchUserDashboard()); }, [dispatch]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  if (!data) return <EmptyState title="Unable to load dashboard" />;

  const activeMembership = (data.memberships || []).find((m) => m.status === 'active');
  const daysLeft = getDaysRemaining(activeMembership?.end_date);
  const totalPaid = (data.payments || []).filter((p) => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0);
  const latestMeasurement = (data.measurements || [])[0];
  const previousMeasurement = (data.measurements || [])[1];

  function delta(field) {
    if (!latestMeasurement || !previousMeasurement) return null;
    const diff = Number(latestMeasurement[field]) - Number(previousMeasurement[field]);
    return diff === 0 ? null : diff;
  }

  const showRenewalBanner = activeMembership && daysLeft <= 7;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 to-ink-950 p-6 text-white sm:p-8">
        <p className="text-sm text-surface-400">Welcome back</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{profile?.full_name || 'Athlete'}</h1>
        <p className="mt-2 text-sm text-surface-400">Here's your training overview at a glance.</p>
      </div>

      {showRenewalBanner && (
        <Card className={`border-2 ${daysLeft <= 2 ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className={daysLeft <= 2 ? 'text-red-500' : 'text-amber-500'} />
              <div>
                <p className="font-semibold text-ink-900 dark:text-white">{daysLeft <= 0 ? 'Membership Expired' : `Membership expires in ${daysLeft} days`}</p>
                <p className="text-sm text-surface-500">{activeMembership.plan_name_snapshot} · Renew now to keep your gym access active</p>
              </div>
            </div>
            <Link to="/user/membership"><Button size="sm">Renew Now</Button></Link>
          </div>
        </Card>
      )}

      {!data.admission && (
        <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-amber-500" />
            <div>
              <p className="font-semibold text-ink-900 dark:text-white">Gym Admission Required</p>
              <p className="text-sm text-surface-500">Visit the gym front desk to complete your admission before purchasing a membership.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Dumbbell size={20} /></span>
            <Badge tone={activeMembership ? 'success' : 'neutral'}>{activeMembership ? 'Active' : 'None'}</Badge>
          </div>
          <p className="mt-4 text-xs text-surface-500">Membership</p>
          <p className="mt-1 font-display text-lg font-bold text-ink-950 dark:text-white">{activeMembership ? activeMembership.plan_name_snapshot : 'Not active'}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Calendar size={20} /></span>
            <Badge tone={activeMembership ? (daysLeft < 7 ? 'warning' : 'success') : 'neutral'}>{activeMembership ? `${daysLeft}d` : '—'}</Badge>
          </div>
          <p className="mt-4 text-xs text-surface-500">Days Remaining</p>
          <p className="mt-1 font-display text-lg font-bold text-ink-950 dark:text-white">{activeMembership ? `${daysLeft} days` : '—'}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><CreditCard size={20} /></span>
          </div>
          <p className="mt-4 text-xs text-surface-500">Total Paid</p>
          <p className="mt-1 font-display text-lg font-bold text-ink-950 dark:text-white">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300"><ShoppingBag size={20} /></span>
          </div>
          <p className="mt-4 text-xs text-surface-500">Total Orders</p>
          <p className="mt-1 font-display text-lg font-bold text-ink-950 dark:text-white">{(data.orders || []).length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Body Progress</h3>
            <Link to="/user/body-progress"><Button variant="ghost" size="sm">View <ArrowRight size={14} /></Button></Link>
          </div>
          {latestMeasurement ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {['weight', 'chest', 'stomach'].map((key) => {
                  const d = delta(key);
                  return (
                    <div key={key} className="rounded-xl bg-surface-50 p-3 text-center dark:bg-surface-800">
                      <p className="text-xs capitalize text-surface-500">{key}</p>
                      <p className="mt-1 font-display text-lg font-bold text-ink-950 dark:text-white">{latestMeasurement[key] || '—'}</p>
                      {d !== null && (
                        <p className={`mt-0.5 flex items-center justify-center gap-0.5 text-xs ${d > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {d > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {d > 0 ? '+' : ''}{d.toFixed(1)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {(data.measurements || []).length >= 2 && <MiniTrendChart measurements={data.measurements} />}
              <p className="text-xs text-surface-500">Last measured: {formatDate(latestMeasurement.measurement_date)}</p>
            </div>
          ) : <EmptyState title="No measurements yet" description="Your latest body measurements will appear here." />}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Membership Status</h3>
            <Link to="/user/membership"><Button variant="ghost" size="sm">View <ArrowRight size={14} /></Button></Link>
          </div>
          {activeMembership ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Plan</span><span className="font-semibold text-ink-900 dark:text-white">{activeMembership.plan_name_snapshot}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Start date</span><span className="font-medium">{formatDate(activeMembership.start_date)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">End date</span><span className="font-medium">{formatDate(activeMembership.end_date)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Status</span><Badge tone="success">Active</Badge></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (daysLeft / activeMembership.duration_days) * 100)}%` }} />
              </div>
            </div>
          ) : data.admission ? (
            <div className="py-6 text-center">
              <p className="text-sm text-surface-500">You're admitted but don't have an active membership.</p>
              <Link to="/user/membership" className="mt-4 inline-block"><Button size="sm">Get a membership</Button></Link>
            </div>
          ) : (
            <EmptyState title="No admission yet" description="Ask the gym staff to admit you to start your membership." />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Recent Orders</h3>
            <Link to="/user/orders"><Button variant="ghost" size="sm">View <ArrowRight size={14} /></Button></Link>
          </div>
          {(data.orders || []).length > 0 ? (
            <div className="space-y-3">
              {(data.orders || []).slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-white">{order.order_number}</p>
                    <p className="text-xs text-surface-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(order.total_amount)}</p>
                    <Badge tone={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No orders yet" description="Shop supplements to see your orders here." />}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Recent Payments</h3>
            <Link to="/user/payments"><Button variant="ghost" size="sm">View <ArrowRight size={14} /></Button></Link>
          </div>
          {(data.payments || []).length > 0 ? (
            <div className="space-y-3">
              {(data.payments || []).slice(0, 4).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-white capitalize">{payment.payment_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-surface-500">{formatDate(payment.payment_date || payment.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                    <Badge tone={payment.status === 'success' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}>{payment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No payments yet" />}
        </Card>
      </div>
    </div>
  );
}
