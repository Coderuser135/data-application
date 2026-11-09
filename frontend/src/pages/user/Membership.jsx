import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CreditCard, Check, AlertCircle, Tag, ArrowRight, Crown, Dumbbell, Sparkles, Zap } from 'lucide-react';
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
    await Promise.all([dispatch(fetchMyMemberships()), dispatch(fetchActivePlans())]);
  }

  async function purchasePlan(plan) {
    const advanceCredit = Number(plan.advance_credit || 0);
    const payablePrice = Number(plan.payable_price ?? plan.price);
    if (!confirm(`Plan: ${plan.name}\nPlan price: ${formatCurrency(plan.price)}\nAdmission advance applied: ${formatCurrency(advanceCredit)}\nYou pay: ${formatCurrency(payablePrice)}\n\nProceed with purchase?`)) return;
    try {
      if (!admission || admission.status !== 'active') {
        alert('Your gym admission is pending. Please ask gym staff to complete your admission before purchasing a membership.');
        return;
      }
      const membership = await dispatch(purchaseMembership(plan.id)).unwrap();
      if (membership.payment_status === 'paid' || Number(membership.amount_due) === 0) {
        await Promise.all([dispatch(fetchMyMemberships()), dispatch(fetchActivePlans())]);
        alert('Your advance credit covered the full plan price. Your membership is now active.');
        return;
      }
      await payMembership(membership);
      alert('Payment successful. Your membership is now active.');
    } catch (err) { alert(typeof err === 'string' ? err : (err?.message || 'Membership purchase failed')); }
  }

  async function renew(id) {
    try {
      const membership = await dispatch(renewMembership(id)).unwrap();
      if (membership.payment_status === 'paid' || Number(membership.amount_due) === 0) {
        await dispatch(fetchMyMemberships());
        alert('Your membership is renewed.');
        return;
      }
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

      {(!admission || admission.status !== 'active') && <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10"><div className="flex flex-col items-center py-8 text-center"><AlertCircle size={48} className="text-amber-500" /><h3 className="mt-4 font-display text-lg font-bold text-ink-950 dark:text-white">Admission Pending</h3><p className="mt-2 max-w-sm text-sm text-surface-500">You can view available membership plans now. Gym staff must complete your admission before you can purchase one.</p></div></Card>}

      {(plans || []).length > 0 && (
        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><CreditCard size={19} className="text-brand-600" /><h3 className="font-display text-xl font-bold tracking-tight text-ink-950 dark:text-white">Choose your membership</h3></div>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Compare the plans, benefits and pricing before you join.</p>
            </div>
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{plans.length} plans available</span>
          </div>

          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = activeMembership?.plan_id === plan.id;
              const premium = /premium|elite|pro|gold|platinum|vip/i.test(plan.name || '');
              const offer = Boolean(plan.is_offer);
              const planPrice = Number(plan.price || 0);
              const advanceCredit = Number(plan.advance_credit || 0);
              const payablePrice = Number(plan.payable_price ?? planPrice);
              const originalPrice = Number(plan.original_price || 0);
              const duration = Math.max(1, Number(plan.duration_days || 30));
              const discount = offer && originalPrice > planPrice ? Math.round((1 - planPrice / originalPrice) * 100) : 0;
              const palette = offer
                ? { card: 'border-amber-300 dark:border-amber-700', strip: 'from-amber-400 via-orange-500 to-rose-500', icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', panel: 'bg-amber-50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/15', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', button: 'primary' }
                : premium
                  ? { card: 'border-violet-300 dark:border-violet-700', strip: 'from-violet-500 via-indigo-500 to-blue-500', icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', panel: 'bg-violet-50 border-violet-100 dark:bg-violet-500/5 dark:border-violet-500/15', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300', button: 'primary' }
                  : { card: 'border-sky-200 dark:border-sky-800', strip: 'from-sky-400 via-cyan-500 to-teal-400', icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', panel: 'bg-sky-50 border-sky-100 dark:bg-sky-500/5 dark:border-sky-500/15', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300', button: 'secondary' };
              const PlanIcon = offer ? Sparkles : premium ? Crown : Dumbbell;

              return (
                <article key={plan.id} className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-surface-900 ${palette.card}`}>
                  <div className={`h-1.5 bg-gradient-to-r ${palette.strip}`} />
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon}`}><PlanIcon size={21} /></div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {offer && <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${palette.badge}`}>SPECIAL OFFER</span>}
                        {premium && !offer && <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${palette.badge}`}>PREMIUM</span>}
                        {isCurrent && <Badge tone="success">CURRENT</Badge>}
                      </div>
                    </div>

                    <h4 className="mt-4 break-words font-display text-xl font-extrabold tracking-tight text-ink-950 dark:text-white">{plan.name}</h4>
                    <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400"><Zap size={12} className="mr-1 inline" />{duration} days gym access</p>

                    <div className={`mt-4 rounded-xl border p-4 ${palette.panel}`}>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        {(discount > 0 || advanceCredit > 0) && <span className="text-sm text-surface-400 line-through">{formatCurrency(discount > 0 ? originalPrice : planPrice)}</span>}
                        <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white">{formatCurrency(payablePrice)}</span>
                        {discount > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{discount}% OFF</span>}
                      </div>
                      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{advanceCredit > 0 ? 'Payable after admission advance' : 'Total membership price'}</p>
                      {advanceCredit > 0 && <div className="mt-3 space-y-2 border-t border-surface-200 pt-3 text-xs dark:border-surface-700"><div className="flex justify-between gap-2 text-surface-600 dark:text-surface-300"><span>Plan price</span><strong>{formatCurrency(planPrice)}</strong></div><div className="flex justify-between gap-2 text-emerald-700 dark:text-emerald-400"><span>Admission advance</span><strong>− {formatCurrency(advanceCredit)}</strong></div><div className="flex justify-between gap-2 border-t border-surface-200 pt-2 font-bold text-ink-950 dark:border-surface-700 dark:text-white"><span>Payable now</span><strong>{formatCurrency(payablePrice)}</strong></div></div>}
                      <p className="mt-2 text-[11px] text-surface-500 dark:text-surface-400">Approx. {formatCurrency(planPrice / duration)} per day</p>
                    </div>

                    <p className="mt-3 min-h-10 text-sm leading-5 text-surface-600 dark:text-surface-300">{plan.description || 'A membership option designed to support your fitness journey.'}</p>

                    <div className="mt-4 flex-1 border-t border-surface-100 pt-3 dark:border-surface-800">
                      <div className="mb-3 flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-wider text-surface-500 dark:text-surface-400">Plan benefits</p><span className="text-[10px] font-semibold text-surface-400">{(plan.features || []).length} included</span></div>
                      {(plan.features || []).length ? <ul className="space-y-2.5">{plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2 text-sm leading-5 text-surface-700 dark:text-surface-300"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${palette.icon}`}><Check size={10} strokeWidth={3} /></span><span className="min-w-0 break-words">{feature}</span></li>)}</ul> : <p className="text-sm text-surface-400">No benefits listed yet.</p>}
                    </div>

                    <div className="mt-5 border-t border-surface-100 pt-3 dark:border-surface-800">
                      {isCurrent ? <Button variant="secondary" className="w-full" disabled>You're on this plan</Button> : !admission || admission.status !== 'active' ? <Button variant="secondary" className="w-full" disabled>Admission required</Button> : activeMembership ? <Button variant="outline" className="w-full" onClick={() => renew(activeMembership.id)}>Renew membership <ArrowRight size={15} /></Button> : <Button className="w-full" onClick={() => purchasePlan(plan)}>Choose this plan <ArrowRight size={15} /></Button>}
                      <p className="mt-2 text-center text-[10px] text-surface-400">Secure payment · Details saved to your account</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <Card padding={false}><div className="border-b border-surface-200 px-5 py-4 dark:border-surface-800"><h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Membership History</h3></div>{(memberships || []).length > 0 ? <div className="p-5"><div className="space-y-3">{memberships.map((m) => <div key={m.id} className="flex items-center justify-between border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800"><div><p className="text-sm font-medium text-ink-900 dark:text-white">{m.plan_name_snapshot} — {formatCurrency(m.plan_price_snapshot)}</p><p className="text-xs text-surface-500">{formatDate(m.start_date)} → {formatDate(m.end_date)}</p><p className="text-xs text-surface-500">Advance applied: {formatCurrency(Number(m.advance_paid || 0))} · Remaining: {formatCurrency(Number(m.amount_due ?? 0))}</p></div><div className="flex items-center gap-3">{m.status === 'pending' && <Button size="sm" onClick={() => payMembership(m)}>Pay Now</Button>}{m.status === 'expired' && <Button size="sm" variant="secondary" onClick={() => renew(m.id)}>Renew</Button>}<Badge tone={statusTone[m.status] || 'neutral'}>{m.status.replace(/_/g, ' ')}</Badge></div></div>)}</div></div> : <div className="p-5"><EmptyState title="No memberships yet" /></div>}</Card>
    </div>
  );
}
