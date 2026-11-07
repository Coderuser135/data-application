import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Pencil, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { bannerService } from '@/services/bannerService';

const emptyForm = { image: null, is_active: true };
const getId = (item) => item._id || item.id;

export default function AdminBadgeManager() {
  const { section } = useParams();
  const title = section === 'gym' ? 'Gym Banners' : 'Supplement Store Banners';
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

  function resetForm() {
    setEditingId('');
    setForm(emptyForm);
  }

  function startEdit(item) {
    setEditingId(getId(item));
    setForm({ image: null, is_active: Boolean(item.is_active) });
    setSuccess('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.image && !editingId) {
      setError('Please select a banner image.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('section', section);
      data.append('is_active', String(form.is_active));
      if (form.image) data.append('image', form.image);
      if (editingId) await bannerService.update(editingId, data);
      else await bannerService.create(data);
      resetForm();
      setSuccess(editingId ? 'Banner image updated successfully.' : 'Banner uploaded successfully.');
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.error || 'Banner could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm('Delete this banner image permanently?')) return;
    setError('');
    setSuccess('');
    try {
      await bannerService.delete(getId(item));
      setItems((current) => current.filter((row) => getId(row) !== getId(item)));
      setSuccess('Banner deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Banner could not be deleted.');
    }
  }

  async function toggleStatus(item) {
    const data = new FormData();
    data.append('is_active', String(!item.is_active));
    try {
      await bannerService.update(getId(item), data);
      await loadItems();
      setSuccess(item.is_active ? 'Banner hidden from users.' : 'Banner published to users.');
    } catch (err) {
      setError(err.response?.data?.error || 'Banner status could not be updated.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/banners" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-surface-500 hover:text-brand-600"><ArrowLeft size={16} /> All banner sections</Link>
          <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-surface-500">Upload promotional banner images. Active images rotate automatically on the matching user page.</p>
        </div>
        <Badge tone="info">{items.length} total</Badge>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div>}

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{editingId ? 'Replace banner image' : 'Upload banner image'}</h2>
          {editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}><X size={15} /> Cancel</Button>}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-surface-300 p-5 text-sm font-semibold dark:border-surface-700 sm:flex-row sm:items-center">
            <ImagePlus size={28} className="shrink-0 text-brand-600" />
            <span className="min-w-0 flex-1">
              <span className="block">{editingId ? 'Choose replacement image' : 'Choose banner image'}</span>
              <span className="mt-1 block text-xs font-normal text-surface-500">{form.image?.name || 'JPG, PNG or WEBP · max 5 MB · wide landscape image recommended'}</span>
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" required={!editingId} onChange={(e) => setForm((current) => ({ ...current, image: e.target.files?.[0] || null }))} className="max-w-full text-xs" />
          </label>
          <Button type="submit" loading={saving}><Save size={16} /> {editingId ? 'Replace image' : 'Upload banner'}</Button>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">Manage banner images</h2>
        {loading ? <Card><p className="text-sm text-surface-500">Loading banners...</p></Card>
          : items.length === 0 ? <Card><div className="py-8 text-center"><ImagePlus size={34} className="mx-auto text-surface-400" /><p className="mt-3 font-semibold text-ink-900 dark:text-white">No banners uploaded yet</p><p className="mt-1 text-sm text-surface-500">Upload the first banner image above.</p></div></Card>
            : <div className="grid gap-4 xl:grid-cols-2">{items.map((item) => (
              <Card key={getId(item)} className="overflow-hidden !p-0">
                <div className="relative aspect-[16/6] bg-surface-100 dark:bg-surface-800">
                  <img src={item.image_url} alt="Promotional banner" className="h-full w-full object-cover" />
                  <span className="absolute right-3 top-3"><Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Active' : 'Hidden'}</Badge></span>
                </div>
                <div className="flex flex-wrap gap-2 p-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}><Pencil size={14} /> Replace image</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => toggleStatus(item)}>{item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}{item.is_active ? 'Hide' : 'Publish'}</Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => remove(item)}><Trash2 size={14} /> Delete</Button>
                </div>
              </Card>
            ))}</div>}
      </section>
    </div>
  );
}
