import UserLoadingSkeleton from '@/components/ui/UserLoadingSkeleton';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Dumbbell, CreditCard, AlertCircle, Calendar, IndianRupee, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchMyAdmission } from '@/redux/slices/admissionSlice';
import { fetchMyMemberships } from '@/redux/slices/membershipSlice';
import { formatCurrency, formatDate, getDaysRemaining } from '@/utils/formatters';

export default function MyGym() {
  const dispatch = useDispatch();
  const admission = useSelector((state) => state.admissions.admission);
  const memberships = useSelector((state) => state.memberships.items);
  const admissionLoading = useSelector((state) => state.admissions.loading);
  const membershipLoading = useSelector((state) => state.memberships.loading);
  const loading = admissionLoading || membershipLoading;

  useEffect(() => {
    dispatch(fetchMyAdmission());
    dispatch(fetchMyMemberships());
  }, [dispatch]);

  if (loading) return <UserLoadingSkeleton variant="details" />;

  const activeMembership = (memberships || []).find((m) => m.status === 'active' && m.payment_status === 'paid');
  const scheduledMembership = (memberships || []).find((m) => m.status === 'scheduled' && m.payment_status === 'paid');
  const pendingMembership = (memberships || []).find((m) => m.payment_status === 'pending' && Number(m.amount_due) > 0);
  const currentMembership = activeMembership || scheduledMembership || pendingMembership;
  const daysLeft = getDaysRemaining(currentMembership?.end_date);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">My Gym</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          {admission ? (
          <>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Dumbbell size={24} /></span>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Gym Admission</h3>
              <p className="text-sm text-surface-500">Member ID: <span className="font-mono font-semibold text-brand-600">{admission.member_id}</span></p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-surface-500">Admission date</span><span className="font-medium">{formatDate(admission.admission_date)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">Status</span><Badge tone={admission.status === 'active' ? 'success' : 'neutral'}>{admission.status}</Badge></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">Emergency contact</span><span className="font-medium">{admission.emergency_contact_name || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">Emergency phone</span><span className="font-medium">{admission.emergency_contact_phone || '—'}</span></div>
            {admission.notes && <div className="rounded-xl bg-surface-50 p-3 text-sm text-surface-600 dark:bg-surface-800 dark:text-surface-300">{admission.notes}</div>}
          </div>
          </>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle size={48} className="text-amber-500" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink-950 dark:text-white">Admission Required</h3>
              <p className="mt-2 max-w-sm text-sm text-surface-500">Gym admission is completed by the gym staff at the front desk.</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><CreditCard size={24} /></span>
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Current Membership</h3>
          </div>
          {currentMembership ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Plan</span><span className="font-semibold text-ink-900 dark:text-white">{currentMembership.plan_name_snapshot}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Price</span><span className="font-semibold">{formatCurrency(currentMembership.plan_price_snapshot)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Start date</span><span className="font-medium">{formatDate(currentMembership.start_date)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">End date</span><span className="font-medium">{formatDate(currentMembership.end_date)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">{pendingMembership ? 'Payment status' : scheduledMembership ? 'Membership status' : 'Days remaining'}</span><Badge tone={pendingMembership ? 'warning' : scheduledMembership ? 'info' : daysLeft < 7 ? 'warning' : 'success'}>{pendingMembership ? 'Payment Due' : scheduledMembership ? 'Scheduled' : `${daysLeft} days`}</Badge></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (daysLeft / currentMembership.duration_days) * 100)}%` }} />
              </div>
              {activeMembership && daysLeft <= 7 && (
                <Link to="/user/membership" className="mt-3 inline-block"><Button size="sm">Renew Now <ArrowRight size={14} /></Button></Link>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-surface-500">No active membership. Choose a plan to get started.</p>
              <Link to="/user/membership" className="mt-4 inline-block"><Button size="sm">View Plans <ArrowRight size={14} /></Button></Link>
            </div>
          )}
        </Card>
      </div>

      {(memberships || []).length > 0 && (
        <Card padding={false}>
          <div className="border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Membership History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Start</th>
                  <th className="px-5 py-3 font-medium">End</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-3 font-medium text-ink-900 dark:text-white">{m.plan_name_snapshot}</td>
                    <td className="px-5 py-3">{formatCurrency(m.plan_price_snapshot)}</td>
                    <td className="px-5 py-3">{formatDate(m.start_date)}</td>
                    <td className="px-5 py-3">{formatDate(m.end_date)}</td>
                    <td className="px-5 py-3"><Badge tone={m.payment_status === 'pending' && Number(m.amount_due) > 0 ? 'warning' : m.status === 'active' ? 'success' : m.status === 'scheduled' ? 'info' : m.status === 'pending' ? 'warning' : 'neutral'}>{m.payment_status === 'pending' && Number(m.amount_due) > 0 ? 'payment due' : m.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
