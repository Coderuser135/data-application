import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Pencil, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { bannerService } from '@/services/bannerService';

const emptyForm = { title: '', description: '', button_text: '', button_link: '', sort_order: 0, is_active: true, image: null };
const getId = (item) => item._id || item.id;

export default function AdminBadgeManager() {
  const { section } = useParams();
  const isGym = section === 'gym';
  const title = isGym ? 'Gym Banners' : 'Supplement Store Banners';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await bannerService.getAdmin(section)); setError(''); }
    catch (err) { setError(err.response?.data?.error || 'Banners could not be loaded.'); }
    finally { setLoading(false); }
  }, [section]);

  useEffect(() => { loadItems(); }, [loadItems]);

  function updateField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function startEdit(item) {
    setEditingId(getId(item));
    setForm({ title: item.title || '', description: item.description || '', button_text: item.button_text || '', button_link: item.button_link || '', sort_order: item.sort_order || 0, is_active: Boolean(item.is_active), image: null });
    setSuccess('');
    setError('');
  }
  function resetForm() { setEditingId(''); setForm(emptyForm); }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const data = new FormData();
      data.append('section', section);
      data.append('title', form.title.trim());
      data.append('description', form.description.trim());
      data.append('button_text', form.button_text.trim());
      data.append('button_link', form.button_link.trim());
      data.append('sort_order', String(form.sort_order));
      data.append('is_active', String(form.is_active));
      if (form.image) data.append('image', form.image);
      if (editingId) await bannerService.update(editingId, data);
      else await bannerService.create(data);
      resetForm();
      setSuccess(editingId ? 'Banner updated successfully.' : 'Banner created successfully.');
      await loadItems();
    } catch (err) { setError(err.response?.data?.error || 'Banner could not be saved.'); }
    finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.title}" banner? This also removes its Cloudinary image.`)) return;
    setError(''); setSuccess('');
    try { await bannerService.delete(getId(item)); setItems((current) => current.filter((row) => getId(row) !== getId(item))); setSuccess('Banner deleted successfully.'); }
    catch (err) { setError(err.response?.data?.error || 'Banner could not be deleted.'); }
  }

  async function toggleStatus(item) {
    const data = new FormData();
    data.append('title', item.title || '');
    data.append('description', item.description || '');
    data.append('button_text', item.button_text || '');
    data.append('button_link', item.button_link || '');
    data.append('sort_order', String(item.sort_order || 0));
    data.append('is_active', String(!item.is_active));
    try { await bannerService.update(getId(item), data); await loadItems(); }
    catch (err) { setError(err.response?.data?.error || 'Banner status could not be updated.'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link to="/admin/badges" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-surface-500 hover:text-brand-600"><ArrowLeft size={16} /> All badge sections</Link><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">{title}</h1><p className="mt-1 text-sm text-surface-500">Upload wide promotional images. Active banners rotate automatically on the matching user page.</p></div>
        <Badge tone="info">{items.length} total</Badge>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div>}

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{editingId ? 'Edit banner' : 'Add new banner'}</h2>{editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}><X size={15} /> Cancel edit</Button>}</div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">Banner title<input required maxLength={100} value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. New Year Membership Offer" className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label>
          <label className="space-y-1.5 text-sm font-semibold">Display order<input type="number" min="0" step="1" value={form.sort_order} onChange={(e) => updateField('sort_order', e.target.value)} className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label>
          <label className="space-y-1.5 text-sm font-semibold md:col-span-2">Description<textarea maxLength={240} rows={2} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Short offer details or announcement..." className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label>
          <label className="space-y-1.5 text-sm font-semibold">Button text (optional)<input maxLength={30} value={form.button_text} onChange={(e) => updateField('button_text', e.target.value)} placeholder="Explore offer" className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label>
          <label className="space-y-1.5 text-sm font-semibold">Button link (optional)<input maxLength={500} value={form.button_link} onChange={(e) => updateField('button_link', e.target.value)} placeholder="/user/membership or https://..." className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label>
          <label className="flex items-center gap-3 rounded-xl border border-surface-200 p-3 text-sm font-semibold dark:border-surface-700"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} className="h-4 w-4 accent-brand-600" /> Show this banner to users</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-surface-300 p-3 text-sm font-semibold dark:border-surface-700"><ImagePlus size={20} className="text-brand-600" /><span className="min-w-0 flex-1"><span className="block">Banner image {editingId ? '(optional replacement)' : '(required)'}</span><span className="block truncate text-xs font-normal text-surface-500">{form.image?.name || 'JPG, PNG or WEBP · max 5 MB · wide landscape image recommended'}</span></span><input type="file" accept="image/jpeg,image/png,image/webp" required={!editingId} onChange={(e) => updateField('image', e.target.files?.[0] || null)} className="w-28 text-xs" /></label>
          <div className="md:col-span-2"><Button type="submit" loading={saving}><Save size={16} /> {editingId ? 'Save changes' : 'Create banner'}</Button></div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">Existing banners</h2>
        {loading ? <Card><p className="text-sm text-surface-500">Loading banners...</p></Card> : items.length === 0 ? <Card><div className="py-8 text-center"><ImagePlus size={34} className="mx-auto text-surface-400" /><p className="mt-3 font-semibold text-ink-900 dark:text-white">No banners added yet</p><p className="mt-1 text-sm text-surface-500">Create the first banner using the form above.</p></div></Card> : <div className="grid gap-4 xl:grid-cols-2">{items.map((item) => <Card key={getId(item)} className="overflow-hidden !p-0"><div className="relative aspect-[16/6] bg-surface-100 dark:bg-surface-800"><img src={item.image_url} alt={item.title} className="h-full w-full object-cover" /><span className="absolute right-3 top-3"><Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Active' : 'Hidden'}</Badge></span></div><div className="space-y-3 p-4"><div><h3 className="font-semibold text-ink-950 dark:text-white">{item.title}</h3>{item.description && <p className="mt-1 line-clamp-2 text-sm text-surface-500">{item.description}</p>}<p className="mt-2 text-xs text-surface-400">Display order: {item.sort_order || 0}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}><Pencil size={14} /> Edit</Button><Button type="button" variant="secondary" size="sm" onClick={() => toggleStatus(item)}>{item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}{item.is_active ? 'Hide' : 'Publish'}</Button><Button type="button" variant="danger" size="sm" onClick={() => remove(item)}><Trash2 size={14} /> Delete</Button></div></div></Card>)}</div>}
      </section>
    </div>
  );
}
