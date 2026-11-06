import { useEffect, useState } from 'react';
import { Plus, X, Tag, Pencil, Trash2, Check } from 'lucide-react';
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((plan) => {
            const price = Number(plan.price || 0);
            const originalPrice = Number(plan.original_price || 0);
            const duration = Math.max(1, Number(plan.duration_days || 30));
            const discount = plan.is_offer && originalPrice > price
              ? Math.round((1 - price / originalPrice) * 100)
              : 0;

            return (
              <article
                key={plan.id}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-surface-900 ${
                  plan.is_offer
                    ? 'border-brand-300 ring-1 ring-brand-100 dark:border-brand-700 dark:ring-brand-500/20'
                    : 'border-surface-200 hover:border-surface-300 dark:border-surface-700 dark:hover:border-surface-600'
                }`}
              >
                <div className={`h-1.5 w-full ${plan.is_offer ? 'bg-gradient-to-r from-brand-500 via-rose-500 to-amber-400' : 'bg-gradient-to-r from-surface-300 to-surface-200 dark:from-surface-700 dark:to-surface-800'}`} />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {plan.is_offer && <Badge tone="danger">SPECIAL OFFER</Badge>}
                        <Badge tone={plan.is_active ? 'success' : 'neutral'}>{plan.is_active ? 'Published' : 'Hidden'}</Badge>
                      </div>
                      <h3 className="break-words font-display text-xl font-bold tracking-tight text-ink-950 dark:text-white">{plan.name}</h3>
                      <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">
                        {duration} {duration === 1 ? 'day' : 'days'} access
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" aria-label={`Edit ${plan.name}`} onClick={() => openEdit(plan)} className="rounded-xl border border-surface-200 p-2.5 text-surface-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-700 dark:hover:border-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"><Pencil size={16} /></button>
                      <button type="button" aria-label={`Delete ${plan.name}`} onClick={() => handleDelete(plan.id)} className="rounded-xl border border-surface-200 p-2.5 text-surface-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-surface-700 dark:hover:border-red-900 dark:hover:bg-red-500/10 dark:hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-surface-100 bg-surface-50/80 p-4 dark:border-surface-800 dark:bg-surface-950/70">
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                      {discount > 0 && <span className="mb-1 text-sm font-medium text-surface-400 line-through">{formatCurrency(originalPrice)}</span>}
                      <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white">{formatCurrency(price)}</span>
                      {discount > 0 && <Badge tone="success">{discount}% OFF</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-surface-500 dark:text-surface-400">
                      <span>Effective {formatCurrency(price / duration)} / day</span>
                      {plan.offer_label && <span className="font-semibold text-brand-700 dark:text-brand-300">{plan.offer_label}</span>}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-surface-500 dark:text-surface-400">About this plan</p>
                    <p className="mt-2 min-h-[2.75rem] text-sm leading-6 text-surface-700 dark:text-surface-300">
                      {plan.description || 'No description has been added to this plan yet.'}
                    </p>
                  </div>

                  <div className="mt-5 flex-1 border-t border-surface-100 pt-4 dark:border-surface-800">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-surface-500 dark:text-surface-400">Included benefits</p>
                      <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-300">{(plan.features || []).length} features</span>
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
                    ) : (
                      <p className="text-sm text-surface-400">No features added yet.</p>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
                    <span className="text-xs text-surface-500 dark:text-surface-400">Display priority: {Number(plan.display_order || 0)}</span>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${plan.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'}`}>
                      {plan.is_active ? 'Visible to members' : 'Not visible to members'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState title="No plans yet" description="Create your first membership plan." />}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
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
