import { useEffect, useState } from 'react';
import { Plus, X, Tag, Pencil, Trash2, Check, Crown, Dumbbell, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import { fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan } from '@/redux/slices/membershipPlanSlice';
import { formatCurrency } from '@/utils/formatters';

function PlanForm({ initial, isOffer, onSave, onCancel }) {
  const [data, setData] = useState(initial || {
    name: '', description: '', price: '', original_price: '', duration_days: '30',
    features: [''], is_active: true, display_order: '0',
    is_offer: isOffer, offer_label: '', offer_start_date: '', offer_end_date: '',
  });

  function update(key, value) { setData((prev) => ({ ...prev, [key]: value })); }
  function updateFeature(idx, value) { setData((prev) => { const f = [...prev.features]; f[idx] = value; return { ...prev, features: f }; }); }
  function addFeature() { setData((prev) => ({ ...prev, features: [...prev.features, ''] })); }
  function removeFeature(idx) { setData((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) })); }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...data,
      price: Number(data.price) || 0,
      original_price: data.original_price ? Number(data.original_price) : null,
      duration_days: Number(data.duration_days) || 30,
      display_order: Number(data.display_order) || 0,
      features: data.features.filter((f) => f.trim()),
    };
    onSave(payload);
  }

  const offer = data.is_offer;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {offer && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
          <Tag size={18} className="text-brand-600" />
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">Promotional Offer Plan</span>
        </div>
      )}
      <Input label="Plan Name" value={data.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. 3 Month Premium" required />
      <Input label="Description" value={data.description} onChange={(e) => update('description', e.target.value)} placeholder="Short description" />
      <div className="grid grid-cols-2 gap-3">
        <Input label={offer ? "Offer Price" : "Price"} type="number" value={data.price} onChange={(e) => update('price', e.target.value)} placeholder="0" required />
        <Input label="Duration (days)" type="number" value={data.duration_days} onChange={(e) => update('duration_days', e.target.value)} placeholder="30" required />
      </div>
      {offer && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Original Price" type="number" value={data.original_price} onChange={(e) => update('original_price', e.target.value)} placeholder="Original price" />
            <Input label="Offer Label" value={data.offer_label} onChange={(e) => update('offer_label', e.target.value)} placeholder="e.g. LIMITED TIME" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Offer Start Date" type="date" value={data.offer_start_date} onChange={(e) => update('offer_start_date', e.target.value)} />
            <Input label="Offer End Date" type="date" value={data.offer_end_date} onChange={(e) => update('offer_end_date', e.target.value)} />
          </div>
          {data.original_price && data.price && (
            <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              Save {Math.round((1 - Number(data.price) / Number(data.original_price)) * 100)}% off
            </div>
          )}
        </>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-surface-200">Features</label>
        <div className="space-y-2">
          {data.features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" />
              {data.features.length > 1 && <button type="button" onClick={() => removeFeature(i)} className="rounded-lg p-2 text-surface-400 hover:text-red-500"><X size={16} /></button>}
            </div>
          ))}
          <button type="button" onClick={addFeature} className="text-sm font-medium text-brand-600 hover:text-brand-700">+ Add feature</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Display Order" type="number" value={data.display_order} onChange={(e) => update('display_order', e.target.value)} placeholder="0" />
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-surface-200">Active</label>
          <button type="button" onClick={() => update('is_active', !data.is_active)} className={`flex h-[46px] w-full items-center justify-center rounded-xl border text-sm font-medium transition ${data.is_active ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-surface-300 text-surface-500 dark:border-surface-700'}`}>
            {data.is_active ? <><Check size={16} className="mr-1" /> Active</> : 'Inactive'}
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit"><Check size={16} /> Save Plan</Button>
      </div>
    </form>
  );
}

export default function AdminMembershipPlans() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.membershipPlans);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('normal');
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => { dispatch(fetchMembershipPlans()); }, [dispatch]);

  function openCreate(mode) { setFormMode(mode); setEditingPlan(null); setShowForm(true); }
  function openEdit(plan) { setEditingPlan(plan); setShowForm(true); }

  async function handleSave(payload) {
    try {
      if (editingPlan) {
        await dispatch(updateMembershipPlan({ id: editingPlan.id, data: payload })).unwrap();
      } else {
        await dispatch(createMembershipPlan(payload)).unwrap();
      }
      setShowForm(false);
      setEditingPlan(null);
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this plan?')) return;
    dispatch(deleteMembershipPlan(id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Membership Plans</h1>
          <p className="mt-1 text-sm text-surface-500">Create and manage gym membership plans</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreate('offer')}><Tag size={16} className="text-brand-600" /> Offer Plan</Button>
          <Button onClick={() => openCreate('normal')}><Plus size={16} /> Normal Plan</Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <AdminLoadingSkeleton variant="cards" />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((plan) => {
            const price = Number(plan.price || 0);
            const originalPrice = Number(plan.original_price || 0);
            const duration = Math.max(1, Number(plan.duration_days || 30));
            const discount = plan.is_offer && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
            const premium = /premium|elite|pro|gold|platinum|vip/i.test(plan.name || '');
            const palette = plan.is_offer
              ? { card: 'border-amber-300 dark:border-amber-700', strip: 'from-amber-400 via-orange-500 to-rose-500', icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', panel: 'bg-amber-50/80 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/15', label: 'text-amber-800 dark:text-amber-300', button: 'bg-amber-600' }
              : premium
                ? { card: 'border-violet-300 dark:border-violet-700', strip: 'from-violet-500 via-indigo-500 to-blue-500', icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', panel: 'bg-violet-50/80 border-violet-100 dark:bg-violet-500/5 dark:border-violet-500/15', label: 'text-violet-800 dark:text-violet-300', button: 'bg-violet-600' }
                : { card: 'border-sky-200 dark:border-sky-800', strip: 'from-sky-400 via-cyan-500 to-teal-400', icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', panel: 'bg-sky-50/80 border-sky-100 dark:bg-sky-500/5 dark:border-sky-500/15', label: 'text-sky-800 dark:text-sky-300', button: 'bg-sky-600' };
            const PlanIcon = plan.is_offer ? Sparkles : premium ? Crown : Dumbbell;

            return (
              <article key={plan.id} className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-surface-900 ${palette.card}`}>
                <div className={`h-1.5 bg-gradient-to-r ${palette.strip}`} />
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${palette.icon}`}><PlanIcon size={21} strokeWidth={2.2} /></div>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          {plan.is_offer && <Badge tone="warning">OFFER</Badge>}
                          {premium && !plan.is_offer && <Badge tone="info">PREMIUM</Badge>}
                          <Badge tone={plan.is_active ? 'success' : 'neutral'}>{plan.is_active ? 'Active' : 'Hidden'}</Badge>
                        </div>
                        <h3 className="break-words font-display text-lg font-bold leading-tight text-ink-950 dark:text-white">{plan.name}</h3>
                        <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400"><ShieldCheck size={12} className="mr-1 inline" /> {duration} days membership</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" aria-label={`Edit ${plan.name}`} onClick={() => openEdit(plan)} className="rounded-lg border border-surface-200 p-2 text-surface-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-700 dark:hover:bg-brand-500/10"><Pencil size={15} /></button>
                      <button type="button" aria-label={`Delete ${plan.name}`} onClick={() => handleDelete(plan.id)} className="rounded-lg border border-surface-200 p-2 text-surface-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-surface-700 dark:hover:bg-red-500/10"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  <div className={`mt-4 rounded-xl border p-4 ${palette.panel}`}>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      {discount > 0 && <span className="text-sm text-surface-400 line-through">{formatCurrency(originalPrice)}</span>}
                      <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white">{formatCurrency(price)}</span>
                      {discount > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{discount}% SAVE</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <span className={`font-semibold ${palette.label}`}>{formatCurrency(price / duration)} / day</span>
                      {plan.offer_label && <span className="truncate font-semibold text-surface-600 dark:text-surface-300">{plan.offer_label}</span>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-surface-400">Plan overview</p>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-surface-600 dark:text-surface-300">{plan.description || 'No description added.'}</p>
                  </div>

                  <div className="mt-4 flex-1 border-t border-surface-100 pt-3 dark:border-surface-800">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">What's included</p>
                      <span className="rounded-full bg-surface-100 px-2 py-1 text-[10px] font-bold text-surface-600 dark:bg-surface-800 dark:text-surface-300">{(plan.features || []).length} benefits</span>
                    </div>
                    {(plan.features || []).length ? (
                      <ul className="grid gap-2">
                        {plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2 text-sm leading-5 text-surface-700 dark:text-surface-300"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${palette.icon}`}><Check size={10} strokeWidth={3} /></span><span className="min-w-0 break-words">{feature}</span></li>)}
                      </ul>
                    ) : <p className="text-sm text-surface-400">No benefits added yet.</p>}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-surface-100 pt-3 dark:border-surface-800">
                    <span className="text-[11px] text-surface-500 dark:text-surface-400">Display order · {Number(plan.display_order || 0)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${plan.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>{plan.is_active ? 'PUBLIC' : 'HIDDEN'}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState title="No plans yet" description="Create your first membership plan." />}

      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-800 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-800">
              <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{editingPlan ? 'Edit Plan' : formMode === 'offer' ? 'New Offer Plan' : 'New Plan'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18} /></button>
            </div>
            <div className="p-6">
              <PlanForm
                initial={editingPlan || null}
                isOffer={editingPlan ? editingPlan.is_offer : formMode === 'offer'}
                onSave={handleSave}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
