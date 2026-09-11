import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { productService, categoryService } from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', sale_price: '', stock_quantity: '0', category_id: '', is_active: true });

  useEffect(() => {
    productService.getAll().then((data) => { setProducts(data || []); setLoading(false); });
    categoryService.getAll().then((data) => setCategories(data || []));
  }, []);

  function openNew() { setEditing('new'); setForm({ name: '', description: '', price: '', sale_price: '', stock_quantity: '0', category_id: '', is_active: true }); }
  function openEdit(p) { setEditing(p.id); setForm({ ...p, price: String(p.price), sale_price: p.sale_price ? String(p.sale_price) : '', stock_quantity: String(p.stock_quantity) }); }

  async function save() {
    const payload = { ...form, price: Number(form.price), sale_price: form.sale_price ? Number(form.sale_price) : null, stock_quantity: Number(form.stock_quantity) };
    if (editing === 'new') { await productService.create(payload); }
    else { await productService.update(editing, payload); }
    setEditing(null);
    productService.getAll().then((data) => setProducts(data || []));
  }

  async function remove(id) { if (confirm('Delete this product?')) { await productService.delete(id); productService.getAll().then((data) => setProducts(data || [])); } }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Products</h1><Button onClick={openNew}><Plus size={16} /> New product</Button></div>
      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} padding={false} className="overflow-hidden">
              <div className="flex h-36 items-center justify-center bg-surface-100 text-brand-500 dark:bg-surface-800"><Plus size={36} strokeWidth={1} /></div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{p.category_id?.name}</p>
                <h3 className="mt-1 font-semibold text-ink-950 dark:text-white">{p.name}</h3>
                <div className="mt-2 flex items-center gap-2"><span className="font-display text-lg font-bold">{formatCurrency(p.sale_price || p.price)}</span>{p.sale_price && <span className="text-xs text-surface-400 line-through">{formatCurrency(p.price)}</span>}</div>
                <p className="mt-1 text-xs text-surface-500">Stock: {p.stock_quantity}</p>
                <div className="mt-3 flex gap-2"><button onClick={() => openEdit(p)} className="flex-1 rounded-lg bg-surface-100 py-2 text-sm font-medium hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"><Pencil size={14} className="mx-auto" /></button><button onClick={() => remove(p.id)} className="flex-1 rounded-lg bg-red-50 py-2 text-red-600 hover:bg-red-100 dark:bg-red-500/10"><Trash2 size={14} className="mx-auto" /></button></div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No products yet" description="Add supplement products to your store." />}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><h3 className="font-display text-xl font-bold text-ink-950 dark:text-white">{editing === 'new' ? 'New Product' : 'Edit Product'}</h3><button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={20} /></button></div>
            <div className="space-y-4">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Category</span>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2"><Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><Input label="Sale price (₹)" type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
              <Input label="Stock quantity" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded" /> <span className="text-sm font-medium">Active</span></label>
              <Button onClick={save} className="w-full" size="lg">Save product</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
