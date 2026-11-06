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
  name: '', brand: '', category_id: '', description: '', net_quantity: '',
  expiry_date: '', price: '', mrp: '', cost_price: '',
  stock_quantity: '0', low_stock_threshold: '5',
  is_active: true, image: null,
};

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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [productData, setProductData] = useState({ rows: [], total: 0, pages: 1, stats: { total: 0, low: 0, out: 0 } });
  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState({ quantity: '', reason: '' });
  const [stockHistory, setStockHistory] = useState([]);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [error, setError] = useState('');

  async function loadData() {
    setLoadError('');
    try {
      const result = await productService.getAll({
        search: query,
        category: categoryFilter,
        status: statusFilter,
        stock: stockFilter,
        expiry: expiryFilter,
        sort,
        page: pageNumber,
        limit: pageSize,
      });
      if (pageNumber > result.pages) {
        setPageNumber(result.pages || 1);
        return;
      }
      setProductData(result);
      setProducts(result.rows || []);
    } catch (requestError) {
      setLoadError(requestError.response?.data?.error || 'Supplements could not be loaded. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    categoryService.getAll().then((result) => setCategories(result || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [query, categoryFilter, statusFilter, stockFilter, expiryFilter, sort, pageNumber, pageSize]);

  const stockStats = productData.stats || { total: 0, low: 0, out: 0 };
  const totalPages = Math.max(1, Number(productData.pages) || 1);
  const firstItem = productData.total ? ((pageNumber - 1) * pageSize) + 1 : 0;
  const lastItem = Math.min(pageNumber * pageSize, productData.total || 0);
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(pageNumber - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index);
  }, [pageNumber, totalPages]);

  function updateFilter(setter, value) {
    setter(value);
    setPageNumber(1);
  }

  function clearFilters() {
    setQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setStockFilter('all');
    setExpiryFilter('all');
    setSort('newest');
    setPageNumber(1);
    setPageSize(10);
  }

  function openCreate() {
    setEditing('new'); setForm({ ...EMPTY_FORM }); setImagePreview(''); setSelectedImageName(''); setError('');
  }

  function openEdit(product) {
    setEditing(product.id || product._id);
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      category_id: product.category_id?.id || product.category_id?._id || product.category_id || '',
      description: product.description || '',
      net_quantity: product.net_quantity || '',
      expiry_date: product.expiry_date ? String(product.expiry_date).slice(0, 10) : '',
      price: String(product.price ?? ''),
      mrp: product.mrp == null ? '' : String(product.mrp),
      cost_price: product.cost_price == null ? '' : String(product.cost_price),
      stock_quantity: '0',
      low_stock_threshold: String(product.low_stock_threshold ?? 5),
      is_active: product.is_active !== false,
      image: null,
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
    const sellingPrice = Number(form.price);
    const mrp = form.mrp === '' ? null : Number(form.mrp);
    if (!form.name.trim() || !form.brand.trim() || form.price.trim() === '' || !Number.isFinite(sellingPrice) || sellingPrice < 0) {
      setError('Supplement name, brand and a valid selling price are required.');
      return;
    }
    if (mrp !== null && (!Number.isFinite(mrp) || mrp < sellingPrice)) {
      setError('MRP must be equal to or higher than the selling price.');
      return;
    }
    if (form.expiry_date) {
      const today = new Date();
      const todayString = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
      if (form.expiry_date < todayString) {
        setError('Expiry date cannot be in the past.');
        return;
      }
    }
    if (editing === 'new' && !form.image) { setError('Please upload a product photo.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
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
          <div><h2 className="font-display text-xl font-bold text-ink-950 dark:text-white">{editing === 'new' ? 'Add supplement' : 'Edit supplement'}</h2><p className="mt-1 text-xs text-surface-500">Basic product information, pricing and stock</p></div>
          <button onClick={closeEditor} className="rounded-lg p-2 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={20} /></button>
        </div>
        <div className="space-y-7 p-5 sm:p-7">
          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Product identity</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Supplement name *" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Whey Protein" />
              <Field label="Brand *" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="Brand name" />
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
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Description and pack details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Description</span><textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label></div>
              <Field label="Net quantity / pack size" value={form.net_quantity} onChange={(e) => updateField('net_quantity', e.target.value)} placeholder="e.g. 1 kg" />
              <Field label="Expiry date" type="date" value={form.expiry_date} onChange={(e) => updateField('expiry_date', e.target.value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Pricing</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Selling price (₹) *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
              <Field label="MRP (₹)" type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => updateField('mrp', e.target.value)} />
              <Field label="Purchase cost (₹) · admin only" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => updateField('cost_price', e.target.value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Inventory setup</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {editing === 'new' ? <Field label="Opening physical stock *" type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => updateField('stock_quantity', e.target.value)} /> : <div className="rounded-xl bg-surface-50 p-4 text-sm dark:bg-surface-800"><p className="text-surface-500">Current available stock</p><p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">{products.find((p) => (p.id || p._id) === editing)?.available_quantity ?? '—'} units</p><p className="mt-1 text-xs text-surface-500">Use Adjust stock to record a stock-in or stock-out movement.</p></div>}
              <Field label="Low-stock alert threshold" type="number" min="0" step="1" value={form.low_stock_threshold} onChange={(e) => updateField('low_stock_threshold', e.target.value)} />
            </div>
          </section>
          <div className="flex flex-wrap gap-5 border-t border-surface-200 pt-4 dark:border-surface-800"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} /> Active / visible in store</label></div>
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
      <Card>
        <div className="space-y-3">
          <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" /><input value={query} onChange={(e) => updateFilter(setQuery, e.target.value)} placeholder="Search supplement, brand or SKU..." className="min-h-11 w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-1"><span className="text-xs font-semibold text-surface-500">Category</span><select value={categoryFilter} onChange={(e) => updateFilter(setCategoryFilter, e.target.value)} className="min-h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="all">All categories</option>{categories.map((category) => <option key={category.id || category._id} value={category.id || category._id}>{category.name}</option>)}</select></label>
            <label className="block space-y-1"><span className="text-xs font-semibold text-surface-500">Product status</span><select value={statusFilter} onChange={(e) => updateFilter(setStatusFilter, e.target.value)} className="min-h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="all">All products</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            <label className="block space-y-1"><span className="text-xs font-semibold text-surface-500">Stock status</span><select value={stockFilter} onChange={(e) => updateFilter(setStockFilter, e.target.value)} className="min-h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="all">All stock</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></label>
            <label className="block space-y-1"><span className="text-xs font-semibold text-surface-500">Expiry</span><select value={expiryFilter} onChange={(e) => updateFilter(setExpiryFilter, e.target.value)} className="min-h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="all">Any expiry</option><option value="30">Expiring in 30 days</option><option value="expired">Expired</option><option value="no_date">No expiry date</option></select></label>
          </div>
          <div className="flex flex-col gap-3 border-t border-surface-100 pt-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-surface-500">{productData.total || 0} matching supplements</p>
            <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-300">Sort <select value={sort} onChange={(e) => updateFilter(setSort, e.target.value)} className="min-h-9 rounded-lg border border-surface-300 bg-white px-2 text-xs dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="newest">Newest first</option><option value="name_asc">Name A–Z</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="stock_low">Lowest stock</option></select></label><label className="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-300">Rows <select value={pageSize} onChange={(e) => {setPageSize(Number(e.target.value));setPageNumber(1);}} className="min-h-9 rounded-lg border border-surface-300 bg-white px-2 text-xs dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label><button onClick={clearFilters} className="text-xs font-bold text-brand-700 hover:underline dark:text-brand-300">Clear filters</button></div>
          </div>
        </div>
      </Card>
      {products.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((p) => {
        const available = p.available_quantity ?? Math.max(0, (p.stock_quantity || 0) - (p.reserved_quantity || 0));
        const status = p.stock_status || (available === 0 ? 'out_of_stock' : available <= (p.low_stock_threshold || 5) ? 'low_stock' : 'in_stock');
        return <Card key={p.id || p._id} padding={false} className="overflow-hidden">
          <div className="relative flex h-44 items-center justify-center bg-surface-50 dark:bg-surface-800">{p.image_url || p.images?.[0]?.url ? <img src={p.image_url || p.images?.[0]?.url} alt={p.name} className="h-full w-full object-contain p-3" /> : <Package size={40} className="text-surface-300" />}<span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${status === 'in_stock' ? 'bg-emerald-100 text-emerald-700' : status === 'low_stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{status.replaceAll('_', ' ')}</span></div>
          <div className="space-y-3 p-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-600">{p.brand} · {p.sku}</p><h3 className="mt-1 font-semibold text-ink-950 dark:text-white">{p.name}</h3><p className="mt-1 text-xs text-surface-500">{p.category_id?.name || 'Uncategorized'} · {p.net_quantity || 'Pack size not set'}</p></div>
            <div className="flex items-baseline gap-2"><span className="text-lg font-bold">{formatCurrency(p.price)}</span>{p.mrp != null && <span className="ml-auto text-xs text-surface-500">MRP {formatCurrency(p.mrp)}</span>}</div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-50 p-3 text-center dark:bg-surface-800"><div><p className="text-[10px] text-surface-500">On hand</p><p className="font-bold">{p.stock_quantity}</p></div><div><p className="text-[10px] text-surface-500">Reserved</p><p className="font-bold">{p.reserved_quantity || 0}</p></div><div><p className="text-[10px] text-surface-500">Available</p><p className="font-bold">{available}</p></div></div>
            {p.expiry_date && <p className="text-xs text-surface-500">Expiry: {formatDate(p.expiry_date)}</p>}
            <div className="flex flex-wrap gap-2"><button onClick={() => openEdit(p)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-100 py-2 text-xs font-semibold hover:bg-surface-200 dark:bg-surface-800"><Pencil size={14} /> Edit</button><button onClick={() => { setStockTarget(p); setStockForm({ quantity: '', reason: '' }); setError(''); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><ArrowDownUp size={14} /> Adjust stock</button><button onClick={() => openHistory(p)} className="rounded-lg bg-surface-100 px-3 py-2 text-surface-600 dark:bg-surface-800"><History size={14} /></button><button onClick={() => removeSupplement(p)} className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-500/10"><Trash2 size={14} /></button></div>
          </div>
        </Card>;
      })}</div> : <EmptyState title={productData.total === 0 && !query && categoryFilter === 'all' && statusFilter === 'all' && stockFilter === 'all' && expiryFilter === 'all' ? 'No supplements yet' : 'No matching supplements'} description={productData.total === 0 ? 'Try changing your search or filters, or add a new supplement.' : 'Add your first supplement to start managing the store inventory.'} />}
      {productData.total > 0 && <div className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-surface-500">Showing <strong className="text-ink-900 dark:text-white">{firstItem}–{lastItem}</strong> of <strong className="text-ink-900 dark:text-white">{productData.total}</strong> supplements</p>
        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <button disabled={pageNumber <= 1} onClick={() => setPageNumber((current) => current - 1)} className="flex min-h-9 items-center gap-1 rounded-lg border border-surface-300 px-2.5 text-xs font-semibold text-surface-700 disabled:opacity-40 dark:border-surface-700 dark:text-surface-200"><span>‹</span> Previous</button>
          {pageNumbers.map((number) => <button key={number} onClick={() => setPageNumber(number)} className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold ${pageNumber === number ? 'bg-brand-600 text-white' : 'border border-surface-300 text-surface-700 dark:border-surface-700 dark:text-surface-200'}`}>{number}</button>)}
          <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber((current) => current + 1)} className="flex min-h-9 items-center gap-1 rounded-lg border border-surface-300 px-2.5 text-xs font-semibold text-surface-700 disabled:opacity-40 dark:border-surface-700 dark:text-surface-200">Next <span>›</span></button>
        </div>
      </div>}
      {editor}{stockModal}{historyModal}
    </div>
  );
}
