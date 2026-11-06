import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Package, Search, ImagePlus, Boxes, AlertTriangle, History, ArrowDownUp } from 'lucide-react';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { productService, categoryService } from '@/services/productService';
import { formatCurrency, formatDate } from '@/utils/formatters';

const EMPTY_FORM = {
  name: '', brand: '', sku: '', barcode: '', product_type: 'other', category_id: '',
  description: '', key_features: '', net_quantity: '', serving_information: '',
  ingredients: '', allergen_information: '', manufacturer: '', country_of_origin: 'India',
  fssai_license_number: '', batch_number: '', manufacturing_date: '', expiry_date: '',
  storage_instructions: '', price: '', sale_price: '', mrp: '', cost_price: '',
  tax_rate: '0', stock_quantity: '0', low_stock_threshold: '5',
  is_active: true, is_featured: false, image: null,
};

const TYPES = [
  ['protein', 'Protein'], ['vitamin', 'Vitamin'], ['mineral', 'Mineral'],
  ['hydration', 'Hydration'], ['nutrition_bar', 'Nutrition bar'], ['other', 'Other'],
];

function Field({ label, value, onChange, ...props }) {
  return <Input label={label} value={value ?? ''} onChange={onChange} {...props} />;
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [query, setQuery] = useState('');
  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState({ quantity: '', reason: '' });
  const [stockHistory, setStockHistory] = useState([]);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [error, setError] = useState('');

  async function loadData() {
    setLoadError('');
    try {
      const [productData, categoryData] = await Promise.all([productService.getAll(), categoryService.getAll()]);
      setProducts(productData || []);
      setCategories(categoryData || []);
    } catch {
      setLoadError('Supplements could not be loaded. Please refresh and try again.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((item) => [item.name, item.brand, item.sku, item.barcode].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [products, query]);

  const stockStats = useMemo(() => ({
    total: products.length,
    low: products.filter((p) => p.stock_status === 'low_stock').length,
    out: products.filter((p) => p.stock_status === 'out_of_stock').length,
  }), [products]);

  function openCreate() {
    setEditing('new'); setForm({ ...EMPTY_FORM }); setImagePreview(''); setSelectedImageName(''); setError('');
  }

  function openEdit(product) {
    setEditing(product.id || product._id);
    setForm({
      ...EMPTY_FORM, ...product,
      category_id: product.category_id?.id || product.category_id?._id || '',
      manufacturing_date: product.manufacturing_date ? String(product.manufacturing_date).slice(0, 10) : '',
      expiry_date: product.expiry_date ? String(product.expiry_date).slice(0, 10) : '',
      key_features: Array.isArray(product.key_features) ? product.key_features.join('\n') : '',
      price: String(product.price ?? ''), sale_price: product.sale_price == null ? '' : String(product.sale_price),
      mrp: product.mrp == null ? '' : String(product.mrp), cost_price: product.cost_price == null ? '' : String(product.cost_price),
      tax_rate: String(product.tax_rate ?? 0), stock_quantity: '0',
      low_stock_threshold: String(product.low_stock_threshold ?? 5), image: null,
    });
    setImagePreview(product.image_url || product.images?.[0]?.url || '');
    setSelectedImageName(''); setError('');
  }

  function closeEditor() { setEditing(null); setForm(EMPTY_FORM); setImagePreview(''); setError(''); }

  function updateField(key, value) { setForm((previous) => ({ ...previous, [key]: value })); }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG or WEBP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image size must be 5 MB or less.'); return; }
    setForm((previous) => ({ ...previous, image: file }));
    setImagePreview(URL.createObjectURL(file));
    setSelectedImageName(file.name);
    setError('');
  }

  async function saveSupplement() {
    if (!form.name.trim() || !form.brand.trim() || !form.price) { setError('Supplement name, brand and selling price are required.'); return; }
    if (editing === 'new' && !form.image) { setError('Please upload a product photo.'); return; }
    if (form.expiry_date && form.manufacturing_date && form.expiry_date <= form.manufacturing_date) { setError('Expiry date must be after manufacturing date.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        key_features: form.key_features.split('\n').map((item) => item.trim()).filter(Boolean),
        stock_quantity: editing === 'new' ? Number(form.stock_quantity) : undefined,
      };
      if (editing === 'new') await productService.create(payload);
      else await productService.update(editing, payload);
      closeEditor(); await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Could not save supplement.');
    } finally { setSaving(false); }
  }

  async function removeSupplement(product) {
    const id = product.id || product._id;
    if (!confirm(`Delete "${product.name}" from the supplement catalogue?`)) return;
    try { await productService.delete(id); await loadData(); }
    catch (requestError) { alert(requestError.response?.data?.error || 'This supplement could not be deleted.'); }
  }

  async function submitStockAdjustment() {
    const quantity = Number(stockForm.quantity);
    if (!Number.isInteger(quantity) || quantity === 0 || !stockForm.reason.trim()) { setError('Enter a non-zero whole number and a reason.'); return; }
    try {
      await productService.adjustStock(stockTarget.id || stockTarget._id, { quantity, reason: stockForm.reason.trim() });
      setStockTarget(null); setStockForm({ quantity: '', reason: '' }); setError(''); await loadData();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Stock could not be adjusted.'); }
  }

  async function openHistory(product) {
    setHistoryTarget(product);
    try { setStockHistory(await productService.getStockHistory(product.id || product._id)); }
    catch { setStockHistory([]); }
  }

  if (loading) return <AdminLoadingSkeleton variant="cards" />;
  if (loadError) return <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-surface-900 dark:text-red-300">{loadError}</div>;

  const editor = editing && createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/60 p-3 sm:p-5" onClick={closeEditor}>
      <div className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-surface-900" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200 bg-white px-5 py-4 dark:border-surface-800 dark:bg-surface-900 sm:px-7">
          <div><h2 className="font-display text-xl font-bold text-ink-950 dark:text-white">{editing === 'new' ? 'Add supplement' : 'Edit supplement'}</h2><p className="mt-1 text-xs text-surface-500">Product information, label details and pricing</p></div>
          <button onClick={closeEditor} className="rounded-lg p-2 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={20} /></button>
        </div>
        <div className="space-y-7 p-5 sm:p-7">
          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Product identity</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Supplement name *" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Whey Protein" />
              <Field label="Brand *" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="Brand name" />
              <Field label="SKU * (auto-generated if blank)" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} placeholder="SUP-..." />
              <Field label="Barcode / EAN" value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} />
              <label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Product type</span><select value={form.product_type} onChange={(e) => updateField('product_type', e.target.value)} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white">{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Category</span><select value={form.category_id} onChange={(e) => updateField('category_id', e.target.value)} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="">Uncategorized</option>{categories.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}</select></label>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Product photo</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-surface-300 bg-surface-50 dark:border-surface-700 dark:bg-surface-950">{imagePreview ? <img src={imagePreview} alt="Supplement preview" className="h-full w-full object-contain" /> : <ImagePlus className="text-surface-400" size={34} />}</div>
              <div className="space-y-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-semibold hover:bg-surface-50 dark:border-surface-700 dark:hover:bg-surface-800"><ImagePlus size={16} /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} /></label><p className="text-xs text-surface-500">JPG, PNG or WEBP · Maximum 5 MB · Uploaded securely to Cloudinary</p>{selectedImageName && <p className="text-xs text-brand-600">{selectedImageName}</p>}</div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Description and label information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Description</span><textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label></div>
              <div className="sm:col-span-2"><label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Key features (one per line)</span><textarea rows={3} value={form.key_features} onChange={(e) => updateField('key_features', e.target.value)} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label></div>
              <Field label="Net quantity / pack size" value={form.net_quantity} onChange={(e) => updateField('net_quantity', e.target.value)} placeholder="e.g. 1 kg" />
              <Field label="Serving information (label text)" value={form.serving_information} onChange={(e) => updateField('serving_information', e.target.value)} />
              <Field label="Ingredients" value={form.ingredients} onChange={(e) => updateField('ingredients', e.target.value)} />
              <Field label="Allergen information" value={form.allergen_information} onChange={(e) => updateField('allergen_information', e.target.value)} />
              <Field label="Manufacturer" value={form.manufacturer} onChange={(e) => updateField('manufacturer', e.target.value)} />
              <Field label="Country of origin" value={form.country_of_origin} onChange={(e) => updateField('country_of_origin', e.target.value)} />
              <Field label="FSSAI license number (if applicable)" value={form.fssai_license_number} onChange={(e) => updateField('fssai_license_number', e.target.value)} />
              <Field label="Batch number" value={form.batch_number} onChange={(e) => updateField('batch_number', e.target.value)} />
              <Field label="Manufacturing date" type="date" value={form.manufacturing_date} onChange={(e) => updateField('manufacturing_date', e.target.value)} />
              <Field label="Expiry date" type="date" value={form.expiry_date} onChange={(e) => updateField('expiry_date', e.target.value)} />
              <div className="sm:col-span-2"><Field label="Storage instructions" value={form.storage_instructions} onChange={(e) => updateField('storage_instructions', e.target.value)} /></div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Pricing and tax</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Selling price (₹) *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
              <Field label="Offer / sale price (₹)" type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => updateField('sale_price', e.target.value)} />
              <Field label="MRP (₹)" type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => updateField('mrp', e.target.value)} />
              <Field label="Purchase cost (₹) · admin only" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => updateField('cost_price', e.target.value)} />
              <Field label="Tax rate (%)" type="number" min="0" max="100" step="0.01" value={form.tax_rate} onChange={(e) => updateField('tax_rate', e.target.value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Inventory setup</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {editing === 'new' ? <Field label="Opening physical stock *" type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => updateField('stock_quantity', e.target.value)} /> : <div className="rounded-xl bg-surface-50 p-4 text-sm dark:bg-surface-800"><p className="text-surface-500">Current available stock</p><p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">{products.find((p) => (p.id || p._id) === editing)?.available_quantity ?? '—'} units</p><p className="mt-1 text-xs text-surface-500">Use Adjust stock to record a stock-in or stock-out movement.</p></div>}
              <Field label="Low-stock alert threshold" type="number" min="0" step="1" value={form.low_stock_threshold} onChange={(e) => updateField('low_stock_threshold', e.target.value)} />
            </div>
          </section>
          <div className="flex flex-wrap gap-5 border-t border-surface-200 pt-4 dark:border-surface-800"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} /> Active / visible in store</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => updateField('is_featured', e.target.checked)} /> Featured supplement</label></div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={closeEditor}>Cancel</Button><Button onClick={saveSupplement} loading={saving} disabled={saving}>{editing === 'new' ? 'Create supplement' : 'Save changes'}</Button></div>
        </div>
      </div>
    </div>, document.body,
  );

  const stockModal = stockTarget && createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 p-4" onClick={() => setStockTarget(null)}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-bold">Adjust inventory</h3><button onClick={() => setStockTarget(null)}><X size={20} /></button></div>
        <p className="mb-4 text-sm text-surface-500">{stockTarget.name} · Available: {stockTarget.available_quantity ?? 0} · Reserved: {stockTarget.reserved_quantity ?? 0}</p>
        <Field label="Quantity change (+ add / − remove)" type="number" step="1" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="e.g. 25 or -3" />
        <div className="mt-4"><Field label="Reason (required)" value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} placeholder="Purchase received, damaged stock..." /></div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setStockTarget(null)}>Cancel</Button><Button onClick={submitStockAdjustment}>Save adjustment</Button></div>
      </div>
    </div>, document.body,
  );

  const historyModal = historyTarget && createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 p-4" onClick={() => setHistoryTarget(null)}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Stock movement history</h3><p className="text-xs text-surface-500">{historyTarget.name}</p></div><button onClick={() => setHistoryTarget(null)}><X size={20} /></button></div>
        {stockHistory.length ? <div className="space-y-3">{stockHistory.map((movement) => <div key={movement.id || movement._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 p-3 text-sm dark:border-surface-800"><div><p className="font-semibold capitalize">{movement.movement_type?.replaceAll('_', ' ')}</p><p className="text-xs text-surface-500">{movement.reason || '—'} · {formatDate(movement.created_at)}</p></div><div className="text-right"><p className="font-bold">{movement.quantity > 0 ? '+' : ''}{movement.quantity}</p><p className="text-xs text-surface-500">{movement.stock_before} → {movement.stock_after} units</p></div></div>)}</div> : <p className="py-8 text-center text-sm text-surface-500">No stock movements recorded yet.</p>}
      </div>
    </div>, document.body,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Supplements</h1><p className="mt-1 text-sm text-surface-500">Catalogue, pricing and inventory control</p></div><Button onClick={openCreate}><Plus size={16} /> Add supplement</Button></div>
      <div className="grid gap-3 sm:grid-cols-3"><Card><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Catalogue items</p><Package className="text-brand-600" size={18} /></div><p className="mt-2 text-2xl font-bold">{stockStats.total}</p></Card><Card><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Low stock</p><AlertTriangle className="text-amber-500" size={18} /></div><p className="mt-2 text-2xl font-bold">{stockStats.low}</p></Card><Card><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Out of stock</p><Boxes className="text-red-500" size={18} /></div><p className="mt-2 text-2xl font-bold">{stockStats.out}</p></Card></div>
      <Card><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by supplement, brand or SKU..." className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div></Card>
      {filteredProducts.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((p) => {
        const available = p.available_quantity ?? Math.max(0, (p.stock_quantity || 0) - (p.reserved_quantity || 0));
        const status = p.stock_status || (available === 0 ? 'out_of_stock' : available <= (p.low_stock_threshold || 5) ? 'low_stock' : 'in_stock');
        return <Card key={p.id || p._id} padding={false} className="overflow-hidden">
          <div className="relative flex h-44 items-center justify-center bg-surface-50 dark:bg-surface-800">{p.image_url || p.images?.[0]?.url ? <img src={p.image_url || p.images?.[0]?.url} alt={p.name} className="h-full w-full object-contain p-3" /> : <Package size={40} className="text-surface-300" />}<span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${status === 'in_stock' ? 'bg-emerald-100 text-emerald-700' : status === 'low_stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{status.replaceAll('_', ' ')}</span></div>
          <div className="space-y-3 p-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-600">{p.brand} · {p.sku}</p><h3 className="mt-1 font-semibold text-ink-950 dark:text-white">{p.name}</h3><p className="mt-1 text-xs text-surface-500">{p.category_id?.name || 'Uncategorized'} · {p.net_quantity || 'Pack size not set'}</p></div>
            <div className="flex items-baseline gap-2"><span className="text-lg font-bold">{formatCurrency(p.sale_price ?? p.price)}</span>{p.sale_price != null && <span className="text-xs text-surface-400 line-through">{formatCurrency(p.price)}</span>}{p.mrp != null && <span className="ml-auto text-xs text-surface-500">MRP {formatCurrency(p.mrp)}</span>}</div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-50 p-3 text-center dark:bg-surface-800"><div><p className="text-[10px] text-surface-500">On hand</p><p className="font-bold">{p.stock_quantity}</p></div><div><p className="text-[10px] text-surface-500">Reserved</p><p className="font-bold">{p.reserved_quantity || 0}</p></div><div><p className="text-[10px] text-surface-500">Available</p><p className="font-bold">{available}</p></div></div>
            {p.expiry_date && <p className="text-xs text-surface-500">Expiry: {formatDate(p.expiry_date)}</p>}
            <div className="flex flex-wrap gap-2"><button onClick={() => openEdit(p)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-100 py-2 text-xs font-semibold hover:bg-surface-200 dark:bg-surface-800"><Pencil size={14} /> Edit</button><button onClick={() => { setStockTarget(p); setStockForm({ quantity: '', reason: '' }); setError(''); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><ArrowDownUp size={14} /> Adjust stock</button><button onClick={() => openHistory(p)} className="rounded-lg bg-surface-100 px-3 py-2 text-surface-600 dark:bg-surface-800"><History size={14} /></button><button onClick={() => removeSupplement(p)} className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-500/10"><Trash2 size={14} /></button></div>
          </div>
        </Card>;
      })}</div> : <EmptyState title={query ? 'No matching supplements' : 'No supplements yet'} description={query ? 'Try another name, brand or SKU.' : 'Add your first supplement to start managing the store inventory.'} />}
      {editor}{stockModal}{historyModal}
    </div>
  );
}
