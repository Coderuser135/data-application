import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CreditCard, Check, AlertCircle, Tag, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchMyMemberships, fetchActivePlans, purchaseMembership, renewMembership } from '@/redux/slices/membershipSlice';
import { fetchMyAdmission } from '@/redux/slices/admissionSlice';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate, getDaysRemaining } from '@/utils/formatters';

export default function Membership() {
  const dispatch = useDispatch();
  const memberships = useSelector((state) => state.memberships.items);
  const plans = useSelector((state) => state.memberships.plans);
  const admission = useSelector((state) => state.admissions.admission);
  const loading = useSelector((state) => state.memberships.loading);

  useEffect(() => {
    dispatch(fetchMyMemberships());
    dispatch(fetchActivePlans());
    dispatch(fetchMyAdmission());
  }, [dispatch]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  const activeMembership = (memberships || []).find((m) => m.status === 'active');
  const daysLeft = getDaysRemaining(activeMembership?.end_date);

  async function payMembership(membership) {
    const { payment, keyId, razorpayOrder } = await paymentService.createRazorpayOrder({ membershipId: membership.id });
    if (!razorpayOrder || !keyId || typeof window.Razorpay !== 'function') throw new Error('Online payment is temporarily unavailable. Please try again later.');
    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'IronForge Gym',
        description: `${membership.plan_name_snapshot} membership`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try { await paymentService.verifyRazorpayPayment(response); resolve(); }
          catch (err) { reject(err); }
        },
        modal: { ondismiss: () => reject(new Error('Payment cancelled. Membership remains pending.')) },
      });
      rzp.on('payment.failed', (response) => reject(new Error(response?.error?.description || 'Payment failed')));
      rzp.open();
    });
    await dispatch(fetchMyMemberships());
  }

  async function purchasePlan(plan) {
    if (!confirm(`Plan: ${plan.name}\nPrice: ${formatCurrency(plan.price)}\n\nProceed with purchase?`)) return;
    try {
      const membership = await dispatch(purchaseMembership(plan.id)).unwrap();
      await payMembership(membership);
      alert('Payment successful. Your membership is now active.');
    } catch (err) { alert(typeof err === 'string' ? err : (err?.message || 'Membership purchase failed')); }
  }

  async function renew(id) {
    try {
      const membership = await dispatch(renewMembership(id)).unwrap();
      await payMembership(membership);
      alert('Payment successful. Your membership is renewed.');
    } catch (err) { alert(typeof err === 'string' ? err : (err?.message || 'Membership renewal failed')); }
  }

  const statusTone = { active: 'success', pending: 'warning', expired: 'neutral', cancelled: 'danger', not_purchased: 'neutral' };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Membership</h1><p className="mt-1 text-sm text-surface-500">Choose a plan that fits your fitness goals</p></div>

      {activeMembership && (
        <Card className="border-l-4 border-l-brand-600">
          <div className="flex items-center justify-between"><div><p className="text-sm text-brand-700 dark:text-brand-400">Active Membership</p><h3 className="mt-1 font-display text-xl font-bold text-ink-950 dark:text-white">{activeMembership.plan_name_snapshot}</h3><p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{formatDate(activeMembership.start_date)} — {formatDate(activeMembership.end_date)} ({daysLeft} days left)</p></div><Badge tone="success">Active</Badge></div>
          {daysLeft <= 7 && <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10"><span className="text-sm font-medium text-amber-700 dark:text-amber-400">{daysLeft <= 0 ? 'Membership expired' : `Expiring in ${daysLeft} days`}</span><Button size="sm" onClick={() => renew(activeMembership.id)}>Renew Now</Button></div>}
        </Card>
      )}

      {!admission && <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10"><div className="flex flex-col items-center py-8 text-center"><AlertCircle size={48} className="text-amber-500" /><h3 className="mt-4 font-display text-lg font-bold text-ink-950 dark:text-white">Admission Required</h3><p className="mt-2 max-w-sm text-sm text-surface-500">You need to be admitted by gym staff before purchasing a membership. Please visit the gym front desk to complete your admission.</p></div></Card>}

      {admission && (plans || []).length > 0 && <div><div className="mb-4 flex items-center gap-2"><CreditCard size={20} className="text-brand-600" /><h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Available Plans</h3></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(plans || []).map((plan, i) => {
        const isCurrent = activeMembership?.plan_id === plan.id;
        return <Card key={plan.id} className={`relative ${plan.is_offer ? 'border-2 border-brand-600' : ''} ${i === 1 && !plan.is_offer ? 'ring-2 ring-brand-600/20' : ''}`}>
          {plan.is_offer && <div className="absolute -top-3 left-4"><span className="flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white"><Tag size={12} /> {plan.offer_label || 'OFFER'}</span></div>}
          <div className="mt-2"><h4 className="font-display text-lg font-bold text-ink-950 dark:text-white">{plan.name}</h4><p className="text-xs text-surface-500">{plan.duration_days} days</p></div>
          <div className="mt-4 flex items-baseline gap-2">{plan.is_offer && plan.original_price && <span className="text-sm text-surface-400 line-through">{formatCurrency(plan.original_price)}</span>}<span className="font-display text-2xl font-bold text-brand-600">{formatCurrency(plan.price)}</span>{plan.is_offer && plan.original_price && <Badge tone="danger">SAVE {Math.round((1 - plan.price / plan.original_price) * 100)}%</Badge>}</div>
          {plan.description && <p className="mt-2 text-sm text-surface-500">{plan.description}</p>}
          {plan.features?.length > 0 && <ul className="mt-4 space-y-1.5">{plan.features.slice(0, 5).map((f, idx) => <li key={idx} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300"><Check size={14} className="text-emerald-500" /> {f}</li>)}</ul>}
          <div className="mt-5">{isCurrent ? <Button variant="secondary" size="sm" className="w-full" disabled>Current Plan</Button> : activeMembership ? <Button variant="outline" size="sm" className="w-full" onClick={() => renew(activeMembership.id)}>Renew <ArrowRight size={14} /></Button> : <Button size="sm" className="w-full" onClick={() => purchasePlan(plan)}>Purchase</Button>}</div>
        </Card>;
      })}</div></div>}

      <Card padding={false}><div className="border-b border-surface-200 px-5 py-4 dark:border-surface-800"><h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Membership History</h3></div>{(memberships || []).length > 0 ? <div className="p-5"><div className="space-y-3">{memberships.map((m) => <div key={m.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800"><div><p className="text-sm font-medium text-ink-900 dark:text-white">{m.plan_name_snapshot} — {formatCurrency(m.plan_price_snapshot)}</p><p className="text-xs text-surface-500">{formatDate(m.start_date)} → {formatDate(m.end_date)}</p></div><div className="flex items-center gap-3">{m.status === 'pending' && <Button size="sm" onClick={() => payMembership(m)}>Pay Now</Button>}{m.status === 'expired' && <Button size="sm" variant="secondary" onClick={() => renew(m.id)}>Renew</Button>}<Badge tone={statusTone[m.status] || 'neutral'}>{m.status.replace(/_/g, ' ')}</Badge></div></div>)}</div></div> : <div className="p-5"><EmptyState title="No memberships yet" /></div>}</Card>
    </div>
  );
}
