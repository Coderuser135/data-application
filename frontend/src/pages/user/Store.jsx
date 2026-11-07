import UserLoadingSkeleton from '@/components/ui/UserLoadingSkeleton';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, SlidersHorizontal, ArrowUpDown, PackageSearch, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { addToCart } from '@/redux/slices/cartSlice';
import { productService, categoryService } from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';
import BannerCarousel from '@/components/public/BannerCarousel';

const PAGE_SIZE = 12;

export default function UserStore() {
  const dispatch = useDispatch();
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
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
  const [addedId, setAddedId] = useState('');

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getActive({
          search, category, stock, sort, minPrice, maxPrice, page, limit: PAGE_SIZE,
        });
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

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function add(product) {
    dispatch(addToCart(product));
    setAddedId(product.id || product._id);
    setTimeout(() => setAddedId(''), 1100);
  }

  const pages = Math.max(1, Number(result.pages) || 1);
  const first = result.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, result.total || 0);

  return (
    <div className="space-y-7">
      <BannerCarousel section="store">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#171923] via-[#242735] to-[#3b1519] px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
          <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border-[30px] border-white/5" />
          <div className="absolute -bottom-24 right-1/4 h-52 w-52 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"><ShoppingBag size={13} /> Heaven Gym Nutrition</div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Fuel your next level.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Explore training essentials and nutrition supplements selected for your fitness journey.</p>
            </div>
            <Link to="/user/cart" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-50"><ShoppingCart size={17} /> View cart <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white">{cartCount}</span></Link>
          </div>
        </section>
      </BannerCarousel>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Search supplements, brands..." className="w-full rounded-xl border border-surface-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-800 dark:bg-surface-900 dark:text-white" />
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3.5 dark:border-surface-800 dark:bg-surface-900"><ArrowUpDown size={16} className="text-surface-400" /><select value={sort} onChange={(event) => changeFilter(setSort, event.target.value)} className="min-w-36 bg-transparent py-3 text-sm font-medium outline-none dark:text-white"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="name_asc">Name: A to Z</option></select></label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => changeFilter(setCategory, 'all')} className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === 'all' ? 'bg-ink-950 text-white dark:bg-brand-500' : 'bg-white text-surface-600 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-300'}`}>All supplements</button>
          {categories.map((item) => {
            const id = item.id || item._id;
            return <button key={id} onClick={() => changeFilter(setCategory, id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === id ? 'bg-ink-950 text-white dark:bg-brand-500' : 'bg-white text-surface-600 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-300'}`}>{item.name}</button>;
          })}
          <button onClick={() => changeFilter(setStock, stock === 'in' ? 'all' : 'in')} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition ${stock === 'in' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-surface-200 bg-white text-surface-600 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300'}`}><SlidersHorizontal size={13} /> In stock</button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-end">
          <div className="flex-1"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-surface-500">Minimum price</p><input type="number" min="0" value={minPrice} onChange={(event) => changeFilter(setMinPrice, event.target.value)} placeholder="₹ 0" className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div>
          <div className="flex-1"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-surface-500">Maximum price</p><input type="number" min="0" value={maxPrice} onChange={(event) => changeFilter(setMaxPrice, event.target.value)} placeholder="No limit" className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div>
          <button onClick={() => { setSearch(''); setCategory('all'); setStock('all'); setSort('featured'); setMinPrice(''); setMaxPrice(''); setPage(1); }} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10">Clear filters</button>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold text-ink-950 dark:text-white">Shop supplements</h2><p className="mt-1 text-xs text-surface-500">{result.total || 0} products available</p></div></div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {loading ? <UserLoadingSkeleton variant="cards" /> : products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const id = product.id || product._id;
            const image = product.image_url || product.images?.find((item) => item.is_primary)?.url || product.images?.[0]?.url;
            const discount = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
            const unavailable = product.available_quantity <= 0;
            return <Card key={id} padding={false} className="group overflow-hidden border border-surface-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-surface-800">
              <Link to={`/user/store/${id}`} className="block">
                <div className="relative flex h-56 items-center justify-center overflow-hidden bg-white p-5 dark:bg-surface-950">
                  {image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" /> : <PackageSearch size={54} strokeWidth={1.1} className="text-surface-300" />}
                  {discount > 0 && <span className="absolute left-3 top-3 rounded-lg bg-brand-500 px-2.5 py-1 text-[10px] font-extrabold text-white">{discount}% OFF</span>}
                  {unavailable && <span className="absolute right-3 top-3 rounded-lg bg-surface-900/85 px-2.5 py-1 text-[10px] font-bold text-white">Out of stock</span>}
                </div>
                <div className="px-4 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">{product.category_id?.name || product.brand}</p>
                  <h3 className="mt-1 min-h-11 line-clamp-2 font-display text-base font-bold text-ink-950 dark:text-white">{product.name}</h3>
                  <p className="mt-1 text-xs text-surface-500">{product.brand}{product.net_quantity ? ` · ${product.net_quantity}` : ''}</p>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3">
                <div><p className="font-display text-lg font-extrabold text-ink-950 dark:text-white">{formatCurrency(product.price)}</p>{discount > 0 && <p className="text-xs text-surface-400 line-through">{formatCurrency(product.mrp)}</p>}</div>
                <Button size="sm" disabled={unavailable} onClick={() => add(product)}>{addedId === id ? 'Added' : 'Add'}</Button>
              </div>
            </Card>;
          })}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-5 py-16 text-center dark:border-surface-700 dark:bg-surface-900"><PackageSearch className="mx-auto mb-3 text-surface-400" size={38} /><h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">No supplements found</h3><p className="mt-1 text-sm text-surface-500">Try changing your search or filters.</p></div>}

      {!loading && result.total > 0 && <div className="flex flex-col gap-3 border-t border-surface-200 pt-5 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-surface-500">Showing {first}–{last} of {result.total} products</p><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-surface-200 p-2 disabled:opacity-40 dark:border-surface-800"><ChevronLeft size={17} /></button><span className="px-2 text-sm font-semibold text-ink-800 dark:text-white">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-surface-200 p-2 disabled:opacity-40 dark:border-surface-800"><ChevronRight size={17} /></button></div></div>}
    </div>
  );
}
