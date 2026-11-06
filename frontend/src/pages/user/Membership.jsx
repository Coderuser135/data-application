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
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-brand-600" />
                <h3 className="font-display text-xl font-bold tracking-tight text-ink-950 dark:text-white">Choose your membership</h3>
              </div>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Compare the benefits and choose the plan that works for your fitness routine.</p>
            </div>
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{plans.length} {plans.length === 1 ? 'plan' : 'plans'} available</span>
          </div>

          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = activeMembership?.plan_id === plan.id;
              const planPrice = Number(plan.price || 0);
              const advanceCredit = Number(plan.advance_credit || 0);
              const payablePrice = Number(plan.payable_price ?? planPrice);
              const originalPrice = Number(plan.original_price || 0);
              const duration = Math.max(1, Number(plan.duration_days || 30));
              const discount = plan.is_offer && originalPrice > planPrice
                ? Math.round((1 - planPrice / originalPrice) * 100)
                : 0;

              return (
                <article
                  key={plan.id}
                  className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-surface-900 ${
                    plan.is_offer
                      ? 'border-brand-300 ring-1 ring-brand-100 dark:border-brand-700 dark:ring-brand-500/20'
                      : 'border-surface-200 hover:border-surface-300 dark:border-surface-700 dark:hover:border-surface-600'
                  }`}
                >
                  <div className={`h-1.5 w-full ${plan.is_offer ? 'bg-gradient-to-r from-brand-500 via-rose-500 to-amber-400' : 'bg-gradient-to-r from-surface-300 to-surface-200 dark:from-surface-700 dark:to-surface-800'}`} />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex min-h-8 flex-wrap items-center gap-2">
                      {plan.is_offer && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          <Tag size={12} /> {plan.offer_label || 'Limited offer'}
                        </span>
                      )}
                      {isCurrent && <Badge tone="success">Current plan</Badge>}
                    </div>

                    <div className="mt-3">
                      <h4 className="break-words font-display text-xl font-bold tracking-tight text-ink-950 dark:text-white">{plan.name}</h4>
                      <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">{duration} {duration === 1 ? 'day' : 'days'} of gym access</p>
                    </div>

                    <div className="mt-5 rounded-2xl border border-surface-100 bg-surface-50/80 p-4 dark:border-surface-800 dark:bg-surface-950/70">
                      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                        {discount > 0 && <span className="mb-1 text-sm font-medium text-surface-400 line-through">{formatCurrency(originalPrice)}</span>}
                        {advanceCredit > 0 && <span className="mb-1 text-sm font-medium text-surface-400 line-through">{formatCurrency(planPrice)}</span>}
                        <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white">{formatCurrency(payablePrice)}</span>
                        {discount > 0 && <Badge tone="success">{discount}% OFF</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                        {advanceCredit > 0 ? 'Remaining amount after admission advance' : 'Plan price'}
                      </p>
                      {advanceCredit > 0 && (
                        <div className="mt-3 space-y-2 border-t border-surface-200 pt-3 text-xs dark:border-surface-800">
                          <div className="flex items-center justify-between gap-3 text-surface-600 dark:text-surface-300"><span>Membership price</span><span className="font-semibold">{formatCurrency(planPrice)}</span></div>
                          <div className="flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400"><span>Admission advance applied</span><span className="font-semibold">− {formatCurrency(advanceCredit)}</span></div>
                          <div className="flex items-center justify-between gap-3 border-t border-surface-200 pt-2 font-bold text-ink-950 dark:border-surface-800 dark:text-white"><span>Payable now</span><span>{formatCurrency(payablePrice)}</span></div>
                        </div>
                      )}
                      <p className="mt-3 text-[11px] text-surface-500 dark:text-surface-400">Approx. {formatCurrency(planPrice / duration)} per day</p>
                    </div>

                    <p className="mt-4 min-h-[3rem] text-sm leading-6 text-surface-600 dark:text-surface-300">
                      {plan.description || 'A membership plan designed to support your fitness journey.'}
                    </p>

                    <div className="mt-5 flex-1 border-t border-surface-100 pt-4 dark:border-surface-800">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-surface-500 dark:text-surface-400">Plan benefits</p>
                        <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-300">{(plan.features || []).length} included</span>
                      </div>
                      {(plan.features || []).length > 0 ? (
                        <ul className="space-y-3">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2.5 text-sm leading-5 text-surface-700 dark:text-surface-300">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><Check size={12} strokeWidth={3} /></span>
                              <span className="min-w-0 break-words">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-surface-400">Plan benefits will be updated soon.</p>}
                    </div>

                    <div className="mt-6 border-t border-surface-100 pt-4 dark:border-surface-800">
                      {isCurrent ? (
                        <Button variant="secondary" className="w-full" disabled>You're on this plan</Button>
                      ) : !admission || admission.status !== 'active' ? (
                        <Button variant="secondary" className="w-full" disabled>Admission required</Button>
                      ) : activeMembership ? (
                        <Button variant="outline" className="w-full" onClick={() => renew(activeMembership.id)}>Renew membership <ArrowRight size={16} /></Button>
                      ) : (
                        <Button className="w-full" onClick={() => purchasePlan(plan)}>Choose this plan <ArrowRight size={16} /></Button>
                      )}
                      <p className="mt-2 text-center text-[11px] text-surface-400">Secure payment · Membership details in your account</p>
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
