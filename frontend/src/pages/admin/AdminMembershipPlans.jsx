import { useEffect, useState } from 'react';
import { Plus, X, Tag, Pencil, Trash2, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
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

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((plan) => (
            <Card key={plan.id} className={plan.is_offer ? 'border-brand-300 dark:border-brand-800' : ''}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-ink-950 dark:text-white">{plan.name}</h3>
                    {plan.is_offer && <Badge tone="danger">OFFER</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-surface-500">{plan.duration_days} days</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(plan)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(plan.id)} className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                {plan.is_offer && plan.original_price && <span className="text-sm text-surface-400 line-through">{formatCurrency(plan.original_price)}</span>}
                <span className="font-display text-2xl font-bold text-brand-600">{formatCurrency(plan.price)}</span>
                {plan.is_offer && plan.original_price && <Badge tone="danger">SAVE {Math.round((1 - plan.price / plan.original_price) * 100)}%</Badge>}
              </div>
              {plan.description && <p className="mt-2 text-sm text-surface-500">{plan.description}</p>}
              {plan.features.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {plan.features.slice(0, 5).map((f, i) => <li key={i} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300"><Check size={14} className="text-emerald-500" /> {f}</li>)}
                </ul>
              )}
              <div className="mt-4 flex items-center gap-2">
                <Badge tone={plan.is_active ? 'success' : 'neutral'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
                {plan.offer_label && <Badge tone="info">{plan.offer_label}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      ) : !loading ? <EmptyState title="No plans yet" description="Create your first membership plan." /> : null}

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
