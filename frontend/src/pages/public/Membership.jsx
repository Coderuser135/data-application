import { Check, HelpCircle, Crown, Dumbbell, Sparkles, Tag, Zap, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { fetchMembershipPlans } from '@/redux/slices/membershipPlanSlice';
import { formatCurrency } from '@/utils/formatters';

export default function Membership() {
  const dispatch = useDispatch();
  const plans = useSelector((state) => state.membershipPlans.items);

  useEffect(() => { dispatch(fetchMembershipPlans()); }, [dispatch]);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink-950 pb-16 pt-32 text-white sm:pb-20 sm:pt-36">
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-brand-300"><Dumbbell size={13} /> Heaven Gym memberships</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">Choose your plan.<br /><span className="text-brand-400">Own your progress.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-surface-300 sm:text-lg">Straightforward membership options, clear benefits and no confusing surprises. Find the plan that fits your training routine.</p>
        </div>
      </section>

      <section className="bg-surface-50 py-12 dark:bg-surface-950 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Find your fit" title="Memberships built for your goals" description="Compare every plan and see exactly what's included before you join." />
          {plans.length > 0 ? (
            <div className="mt-9 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const premium = /premium|elite|pro|gold|platinum|vip/i.test(plan.name || '');
                const offer = Boolean(plan.is_offer);
                const price = Number(plan.price || 0);
                const originalPrice = Number(plan.original_price || 0);
                const duration = Math.max(1, Number(plan.duration_days || 30));
                const discount = offer && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
                const palette = offer
                  ? { card: 'border-amber-300 shadow-amber-900/5', strip: 'from-amber-400 via-orange-500 to-rose-500', icon: 'bg-amber-100 text-amber-700', panel: 'bg-amber-50 border-amber-100', badge: 'bg-amber-100 text-amber-800', button: 'primary', label: 'OFFER PLAN' }
                  : premium
                    ? { card: 'border-violet-300 shadow-violet-900/10', strip: 'from-violet-500 via-indigo-500 to-blue-500', icon: 'bg-violet-100 text-violet-700', panel: 'bg-violet-50 border-violet-100', badge: 'bg-violet-100 text-violet-800', button: 'primary', label: 'PREMIUM' }
                    : { card: 'border-sky-200 shadow-sky-900/5', strip: 'from-sky-400 via-cyan-500 to-teal-400', icon: 'bg-sky-100 text-sky-700', panel: 'bg-sky-50 border-sky-100', badge: 'bg-sky-100 text-sky-800', button: 'secondary', label: 'STANDARD' };
                const PlanIcon = offer ? Sparkles : premium ? Crown : Dumbbell;

                return (
                  <article key={plan.id} className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-surface-700 dark:bg-surface-900 ${palette.card}`}>
                    <div className={`h-1.5 bg-gradient-to-r ${palette.strip}`} />
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${palette.icon}`}><PlanIcon size={23} /></div>
                        <span className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold tracking-wider ${palette.badge}`}>{palette.label}</span>
                      </div>
                      <h3 className="mt-5 break-words font-display text-2xl font-extrabold tracking-tight text-ink-950 dark:text-white">{plan.name}</h3>
                      <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400"><Zap size={13} className="mr-1 inline" /> {duration} days of gym access</p>

                      <div className={`mt-5 rounded-xl border p-4 ${palette.panel} dark:border-white/10 dark:bg-white/[0.03]`}>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          {discount > 0 && <span className="text-sm text-surface-400 line-through">{formatCurrency(originalPrice)}</span>}
                          <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white">{formatCurrency(price)}</span>
                          {discount > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{discount}% OFF</span>}
                        </div>
                        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Just {formatCurrency(price / duration)} per day</p>
                        {plan.offer_label && <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300"><Tag size={12} className="mr-1 inline" />{plan.offer_label}</p>}
                      </div>

                      <p className="mt-4 min-h-12 text-sm leading-6 text-surface-600 dark:text-surface-300">{plan.description || 'A focused membership option to support your fitness journey.'}</p>

                      <div className="mt-5 flex-1 border-t border-surface-100 pt-4 dark:border-surface-800">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-surface-500 dark:text-surface-400">Included benefits</p>
                          <span className="text-[11px] font-semibold text-surface-400">{(plan.features || []).length} features</span>
                        </div>
                        {(plan.features || []).length > 0 ? (
                          <ul className="space-y-3">
                            {plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2.5 text-sm leading-5 text-surface-700 dark:text-surface-300"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${palette.icon}`}><Check size={12} strokeWidth={3} /></span><span className="min-w-0 break-words">{feature}</span></li>)}
                          </ul>
                        ) : <p className="text-sm text-surface-400">Benefits will be updated soon.</p>}
                      </div>

                      <Link to="/register" className="mt-6 block">
                        <Button variant={palette.button} className="w-full">Choose this plan <ArrowRight size={16} /></Button>
                      </Link>
                      <p className="mt-2 text-center text-[11px] text-surface-400">Clear pricing · Gym membership access</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-surface-200 bg-white p-8 text-center dark:border-surface-800 dark:bg-surface-900">
              <Dumbbell className="mx-auto text-brand-500" size={30} />
              <p className="mt-3 font-semibold text-ink-950 dark:text-white">Membership plans will be available soon.</p>
              <p className="mt-1 text-sm text-surface-500">Please check back shortly.</p>
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900 sm:p-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 shrink-0 text-brand-600" />
              <div><p className="font-semibold text-ink-900 dark:text-white">Need help choosing?</p><p className="mt-1 text-sm leading-6 text-surface-600 dark:text-surface-400">Our team can help you understand the membership options and choose one that matches your training routine.</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
