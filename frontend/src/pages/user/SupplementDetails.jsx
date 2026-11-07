import UserLoadingSkeleton from '@/components/ui/UserLoadingSkeleton';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PackageCheck, PackageX, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { useDispatch } from 'react-redux';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { addToCart } from '@/redux/slices/cartSlice';
import { productService } from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';

export default function SupplementDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    productService.getActiveById(id)
      .then((data) => { if (active) setProduct(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'This supplement is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <UserLoadingSkeleton variant="details" />;
  if (error || !product) return <div className="mx-auto max-w-xl py-16 text-center"><PackageX className="mx-auto mb-4 text-surface-400" size={44} /><h2 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Supplement unavailable</h2><p className="mt-2 text-sm text-surface-500">{error || 'This product may have been removed or is currently unavailable.'}</p><Link to="/user/store"><Button className="mt-6">Back to supplement store</Button></Link></div>;

  const image = product.image_url || product.images?.find((item) => item.is_primary)?.url || product.images?.[0]?.url;
  const discount = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const inStock = product.available_quantity > 0;

  function handleAdd() {
    dispatch(addToCart(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="space-y-6">
      <Link to="/user/store" className="inline-flex items-center gap-2 text-sm font-semibold text-surface-500 transition hover:text-brand-600"><ArrowLeft size={16} /> Back to Supplement Store</Link>
      <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <Card padding={false} className="overflow-hidden border border-surface-200 dark:border-surface-800">
          <div className="relative flex min-h-[340px] items-center justify-center bg-white p-8 sm:min-h-[500px] dark:bg-surface-950">
            {image ? <img src={image} alt={product.name} className="max-h-[440px] w-full object-contain" /> : <PackageCheck size={72} className="text-surface-300" />}
            {discount > 0 && <span className="absolute left-5 top-5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-extrabold text-white">{discount}% OFF</span>}
          </div>
        </Card>

        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">{product.category_id?.name || 'Supplement'} · {product.brand}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink-950 dark:text-white sm:text-4xl">{product.name}</h1>
          {product.net_quantity && <p className="mt-2 text-sm text-surface-500">Pack size: {product.net_quantity}</p>}
          <div className="mt-6 flex flex-wrap items-end gap-3"><span className="font-display text-3xl font-extrabold text-ink-950 dark:text-white">{formatCurrency(product.price)}</span>{discount > 0 && <><span className="pb-1 text-base text-surface-400 line-through">{formatCurrency(product.mrp)}</span><span className="pb-1 text-sm font-bold text-emerald-600">{discount}% savings</span></>}</div>
          <div className={`mt-5 inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${inStock ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>{inStock ? <><CheckCircle2 size={15} /> In stock</> : <><PackageX size={15} /> Out of stock</>}</div>
          <Button size="lg" disabled={!inStock} onClick={handleAdd} className="mt-7 w-full sm:w-auto"><ShoppingCart size={17} /> {added ? 'Added to cart' : 'Add to cart'}</Button>
          <div className="mt-7 grid gap-3 border-y border-surface-200 py-5 dark:border-surface-800 sm:grid-cols-2">
            <div className="flex items-center gap-3"><Truck size={19} className="text-brand-500" /><div><p className="text-sm font-bold text-ink-900 dark:text-white">Flexible fulfilment</p><p className="text-xs text-surface-500">Pickup or admin delivery at checkout</p></div></div>
            <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-brand-500" /><div><p className="text-sm font-bold text-ink-900 dark:text-white">Secure checkout</p><p className="text-xs text-surface-500">Protected payment process</p></div></div>
          </div>
          <section className="mt-6"><h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">Product description</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-surface-600 dark:text-surface-300">{product.description || 'Product details will be updated soon.'}</p></section>
          {product.expiry_date && <p className="mt-5 text-xs text-surface-500">Expiry date: {new Date(product.expiry_date).toLocaleDateString('en-IN')}</p>}
        </div>
      </div>
    </div>
  );
}
