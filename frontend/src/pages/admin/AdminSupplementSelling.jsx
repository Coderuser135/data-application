import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, SlidersHorizontal, ArrowUpDown, PackageSearch, ChevronLeft, ChevronRight, Plus, Minus, Trash2, ReceiptText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import { productService, categoryService } from '@/services/productService';
import { offlineSaleService } from '@/services/offlineSaleService';
import { formatCurrency } from '@/utils/formatters';

const PAGE_SIZE = 12;

export default function AdminSupplementSelling() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stock, setStock] = useState('all');
  const [sort, setSort] = useState('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState(location.state?.selectedItems || []);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selling, setSelling] = useState(false);
  const [saleError, setSaleError] = useState('');

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getAll({ search, category, status: 'active', expiry: 'not_expired', stock, sort, minPrice, maxPrice, page, limit: PAGE_SIZE });
        if (!active) return;
        setProducts(data.rows || []);
        setResult(data);
        if (page > data.pages) setPage(data.pages || 1);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.error || 'Supplements could not be loaded. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search, category, stock, sort, minPrice, maxPrice, page]);

  function changeFilter(setter, value) { setter(value); setPage(1); }

  function addProduct(product) {
    const id = product.id || product._id;
    setSelectedItems((current) => {
      const existing = current.find((item) => item.productId === id);
      if (existing) return current.map((item) => item.productId === id ? { ...item, quantity: Math.min(item.quantity + 1, product.available_quantity) } : item);
      return [...current, { productId: id, product, quantity: 1 }];
    });
    setSaleError('');
  }

  function changeQuantity(productId, nextQuantity) {
    setSelectedItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(Number(nextQuantity) || 1, item.product.available_quantity)) } : item));
  }

  function removeItem(productId) {
    setSelectedItems((current) => current.filter((item) => item.productId !== productId));
  }

  const totalAmount = selectedItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const totalUnits = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const pages = Math.max(1, Number(result.pages) || 1);
  const first = result.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, result.total || 0);

  async function completeSale() {
    if (!selectedItems.length || selling) return;
    setSelling(true);
    setSaleError('');
    try {
      const sale = await offlineSaleService.create({
        items: selectedItems.map(({ productId, quantity }) => ({ productId, quantity })),
        customerName,
        customerPhone,
        paymentMethod,
      });
      navigate(`/admin/supplement-selling/bill/${sale._id}`);
    } catch (requestError) {
      setSaleError(requestError.response?.data?.error || 'Sale could not be completed. Please check stock and try again.');
    } finally {
      setSelling(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Heaven Gym · Counter sale</p><h1 className="mt-1 font-display text-2xl font-extrabold text-ink-950 dark:text-white sm:text-3xl">Supplement Selling</h1><p className="mt-2 text-sm text-surface-500">Sell supplements to walk-in customers and generate a printed bill.</p></div>
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 dark:bg-brand-500/10 dark:text-brand-300"><ShoppingBag className="mr-2 inline" size={16} /> {totalUnits} units selected</div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} /><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Search supplements, brands..." className="w-full rounded-xl border border-surface-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-brand-500 dark:border-surface-800 dark:bg-surface-900 dark:text-white" /></div>
          <label className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3.5 dark:border-surface-800 dark:bg-surface-900"><ArrowUpDown size={16} className="text-surface-400" /><select value={sort} onChange={(event) => changeFilter(setSort, event.target.value)} className="min-w-36 bg-transparent py-3 text-sm font-medium outline-none dark:text-white"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="name_asc">Name: A to Z</option></select></label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => changeFilter(setCategory, 'all')} className={`rounded-full px-4 py-2 text-xs font-bold ${category === 'all' ? 'bg-ink-950 text-white dark:bg-brand-500' : 'bg-white text-surface-600 dark:bg-surface-900 dark:text-surface-300'}`}>All supplements</button>
          {categories.map((item) => { const id = item.id || item._id; return <button key={id} onClick={() => changeFilter(setCategory, id)} className={`rounded-full px-4 py-2 text-xs font-bold ${category === id ? 'bg-ink-950 text-white dark:bg-brand-500' : 'bg-white text-surface-600 dark:bg-surface-900 dark:text-surface-300'}`}>{item.name}</button>; })}
          <button onClick={() => changeFilter(setStock, stock === 'in' ? 'all' : 'in')} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold ${stock === 'in' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 bg-white text-surface-600 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300'}`}><SlidersHorizontal size={13} /> In stock</button>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-end">
          <div className="flex-1"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-surface-500">Minimum price</p><input type="number" min="0" value={minPrice} onChange={(event) => changeFilter(setMinPrice, event.target.value)} placeholder="₹ 0" className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div>
          <div className="flex-1"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-surface-500">Maximum price</p><input type="number" min="0" value={maxPrice} onChange={(event) => changeFilter(setMaxPrice, event.target.value)} placeholder="No limit" className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div>
          <button onClick={() => { setSearch(''); setCategory('all'); setStock('all'); setSort('featured'); setMinPrice(''); setMaxPrice(''); setPage(1); }} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-600">Clear filters</button>
        </div>
      </section>

      <div><h2 className="font-display text-xl font-extrabold text-ink-950 dark:text-white">Available supplements</h2><p className="mt-1 text-xs text-surface-500">{result.total || 0} products available</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <AdminLoadingSkeleton variant="cards" /> : products.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const id = product.id || product._id;
            const image = product.image_url || product.images?.find((item) => item.is_primary)?.url || product.images?.[0]?.url;
            const selected = selectedItems.find((item) => item.productId === id);
            return <Card key={id} padding={false} className="group overflow-hidden border border-surface-200 dark:border-surface-800">
              <Link to={`/admin/supplement-selling/${id}`} state={{ selectedItems }} className="block">
                <div className="flex h-52 items-center justify-center overflow-hidden bg-white p-5 dark:bg-surface-950">{image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain" /> : <PackageSearch size={48} className="text-surface-300" />}</div>
                <div className="px-4 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{product.category_id?.name || product.brand}</p><h3 className="mt-1 min-h-11 line-clamp-2 font-display text-base font-bold text-ink-950 dark:text-white">{product.name}</h3><p className="mt-1 text-xs text-surface-500">{product.brand}{product.net_quantity ? ` · ${product.net_quantity}` : ''}</p></div>
              </Link>
              <div className="space-y-3 px-4 pb-4 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="font-display text-lg font-extrabold text-ink-950 dark:text-white">{formatCurrency(product.price)}</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${Number(product.available_quantity) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{Number(product.available_quantity) > 0 ? 'In stock' : 'Out of stock'}</span></div>
                  <Button size="sm" disabled={Number(product.available_quantity) <= 0} onClick={() => addProduct(product)}>{selected ? 'Add another' : 'Add to bill'}</Button>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-50 p-2.5 text-center dark:bg-surface-800">
                  <div><p className="text-[10px] text-surface-500">On hand</p><p className="text-sm font-bold text-ink-900 dark:text-white">{Number(product.stock_quantity || 0)}</p></div>
                  <div><p className="text-[10px] text-surface-500">Reserved</p><p className="text-sm font-bold text-ink-900 dark:text-white">{Number(product.reserved_quantity || 0)}</p></div>
                  <div><p className="text-[10px] text-surface-500">Available</p><p className="text-sm font-bold text-ink-900 dark:text-white">{Number(product.available_quantity || 0)}</p></div>
                </div>
              </div>
            </Card>;
          })}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-5 py-16 text-center dark:bg-surface-900"><PackageSearch className="mx-auto mb-3 text-surface-400" size={38} /><h3 className="font-display text-lg font-bold dark:text-white">No supplements found</h3><p className="mt-1 text-sm text-surface-500">Try changing your search or filters.</p></div>}
      {!loading && result.total > 0 && <div className="flex flex-col gap-3 border-t border-surface-200 pt-5 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-surface-500">Showing {first}–{last} of {result.total} products</p><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-surface-200 p-2 disabled:opacity-40 dark:border-surface-800"><ChevronLeft size={17} /></button><span className="px-2 text-sm font-semibold dark:text-white">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-surface-200 p-2 disabled:opacity-40 dark:border-surface-800"><ChevronRight size={17} /></button></div></div>}

      <section className="space-y-4 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold text-ink-950 dark:text-white">Current bill</h2><p className="mt-1 text-xs text-surface-500">Review the selected products before completing the sale.</p></div><ReceiptText className="text-brand-600" size={24} /></div>
        {!selectedItems.length ? <p className="rounded-xl bg-surface-50 p-5 text-center text-sm text-surface-500 dark:bg-surface-950">No products added yet. Select supplements from the store above.</p> : <div className="space-y-3">
          {selectedItems.map((item) => <div key={item.productId} className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 pb-3 dark:border-surface-800"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink-900 dark:text-white">{item.product.name}</p><p className="text-xs text-surface-500">{formatCurrency(item.product.price)} each</p></div><div className="flex items-center gap-2"><button onClick={() => changeQuantity(item.productId, item.quantity - 1)} className="rounded-lg border p-1.5 dark:border-surface-700"><Minus size={14} /></button><span className="w-7 text-center text-sm font-bold">{item.quantity}</span><button onClick={() => changeQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.product.available_quantity} className="rounded-lg border p-1.5 disabled:opacity-40 dark:border-surface-700"><Plus size={14} /></button><span className="w-20 text-right text-sm font-bold">{formatCurrency(item.product.price * item.quantity)}</span><button onClick={() => removeItem(item.productId)} className="rounded-lg p-1.5 text-red-500"><Trash2 size={15} /></button></div></div>)}
        </div>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-surface-600 dark:text-surface-300">Customer name (optional)<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={120} placeholder="Walk-in customer" className="mt-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label><label className="text-xs font-semibold text-surface-600 dark:text-surface-300">Mobile number (optional)<input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={20} placeholder="Customer phone" className="mt-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></label></div>
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white sm:max-w-xs"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="other">Other</option></select></label>
        {saleError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{saleError}</p>}
        <div className="flex flex-col gap-3 border-t border-surface-200 pt-4 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs text-surface-500">Bill total</p><p className="font-display text-2xl font-extrabold text-ink-950 dark:text-white">{formatCurrency(totalAmount)}</p></div><Button size="lg" disabled={!selectedItems.length || selling} onClick={completeSale}>{selling ? 'Generating bill...' : 'Complete sale & generate bill'}</Button></div>
      </section>
    </div>
  );
}
