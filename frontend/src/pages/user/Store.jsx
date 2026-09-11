import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { addToCart } from '@/redux/slices/cartSlice';
import { fetchProducts, fetchCategories } from '@/redux/slices/productSlice';
import { formatCurrency } from '@/utils/formatters';

export default function UserStore() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.items);
  const categories = useSelector((state) => state.products.categories);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [added, setAdded] = useState('');

  useEffect(() => { dispatch(fetchProducts()); dispatch(fetchCategories()); }, [dispatch]);

  const filtered = useMemo(() => products.filter((p) => (!category || p.category_id === category) && (!search || p.name.toLowerCase().includes(search.toLowerCase()))), [products, category, search]);

  function add(product) { dispatch(addToCart(product)); setAdded(product.id); setTimeout(() => setAdded(''), 1200); }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Supplement Store</h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-white" placeholder="Search products..." />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setCategory('')} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold ${!category ? 'bg-ink-950 text-white dark:bg-brand-500' : 'bg-surface-100 dark:bg-surface-800 dark:text-surface-300'}`}>All</button>
          {categories.map((cat) => <button key={cat.id} onClick={() => setCategory(cat.id)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold ${category === cat.id ? 'bg-ink-950 text-white dark:bg-brand-500' : 'bg-surface-100 dark:bg-surface-800 dark:text-surface-300'}`}>{cat.name}</button>)}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((product) => (
          <Card key={product.id} padding={false} className="group overflow-hidden">
            <div className="flex h-44 items-center justify-center bg-surface-100 text-brand-500 dark:bg-surface-800"><ShoppingBag size={48} strokeWidth={1.2} /></div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{product.product_categories?.name}</p>
              <h3 className="mt-2 min-h-12 font-display text-base font-semibold text-ink-950 dark:text-white">{product.name}</h3>
              <div className="mt-4 flex items-center gap-2">
                <span className="font-display text-xl font-bold">{formatCurrency(product.sale_price || product.price)}</span>
                {product.sale_price && <span className="text-xs text-surface-400 line-through">{formatCurrency(product.price)}</span>}
              </div>
              <Button onClick={() => add(product)} size="sm" className="mt-4 w-full" variant={added === product.id ? 'secondary' : 'primary'}>{added === product.id ? 'Added!' : 'Add to cart'}</Button>
            </div>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="py-20 text-center text-surface-500"><p>No products found.</p></div>}
    </div>
  );
}
