import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck, PackageX, Plus, Minus } from 'lucide-react';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { productService } from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';

export default function AdminSupplementSellingDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    productService.getActiveById(id).then((data) => { if (active) setProduct(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'This supplement is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <AdminLoadingSkeleton variant="details" />;
  if (!product || error) return <div className="py-16 text-center"><PackageX className="mx-auto mb-3 text-surface-400" size={42} /><p className="font-semibold dark:text-white">Supplement unavailable</p><p className="mt-2 text-sm text-surface-500">{error}</p><Link to="/admin/supplement-selling" className="mt-5 inline-block text-sm font-semibold text-brand-600">Back to Supplement Selling</Link></div>;

  const image = product.image_url || product.images?.find((item) => item.is_primary)?.url || product.images?.[0]?.url;
  const inStock = Number(product.available_quantity) > 0;

  function addToBill() {
    const existing = location.state?.selectedItems || [];
    const productId = product.id || product._id;
    const found = existing.find((item) => item.productId === productId);
    const selectedItems = found
      ? existing.map((item) => item.productId === productId ? { ...item, product, quantity: Math.min(item.quantity + quantity, product.available_quantity) } : item)
      : [...existing, { productId, product, quantity }];
    navigate('/admin/supplement-selling', { state: { selectedItems } });
  }

  return <div className="space-y-6">
    <Link to="/admin/supplement-selling" state={{ selectedItems: location.state?.selectedItems || [] }} className="inline-flex items-center gap-2 text-sm font-semibold text-surface-500"><ArrowLeft size={16} /> Back to Supplement Selling</Link>
    <div className="grid gap-7 lg:grid-cols-2">
      <Card padding={false} className="overflow-hidden border border-surface-200 dark:border-surface-800"><div className="flex min-h-[340px] items-center justify-center bg-white p-8 dark:bg-surface-950">{image ? <img src={image} alt={product.name} className="max-h-[440px] w-full object-contain" /> : <PackageCheck size={70} className="text-surface-300" />}</div></Card>
      <div className="flex flex-col"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">{product.category_id?.name || 'Supplement'} · {product.brand}</p><h1 className="mt-3 font-display text-3xl font-extrabold text-ink-950 dark:text-white">{product.name}</h1>{product.net_quantity && <p className="mt-2 text-sm text-surface-500">Pack size: {product.net_quantity}</p>}<p className="mt-6 font-display text-3xl font-extrabold text-ink-950 dark:text-white">{formatCurrency(product.price)}</p><div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{inStock ? 'In stock' : 'Out of stock'}</span>
          <p className="text-sm text-surface-500">{Number(product.available_quantity || 0)} units available</p>
        </div><p className="mt-6 whitespace-pre-line text-sm leading-7 text-surface-600 dark:text-surface-300">{product.description || 'Product details will be updated soon.'}</p>{product.expiry_date && <p className="mt-4 text-xs text-surface-500">Expiry date: {new Date(product.expiry_date).toLocaleDateString('en-IN')}</p>}
        <div className="mt-8 flex items-center gap-3"><button disabled={!inStock || quantity <= 1} onClick={() => setQuantity((value) => value - 1)} className="rounded-lg border border-surface-200 p-3 disabled:opacity-40 dark:border-surface-700"><Minus size={16} /></button><span className="min-w-8 text-center text-lg font-bold dark:text-white">{quantity}</span><button disabled={!inStock || quantity >= product.available_quantity} onClick={() => setQuantity((value) => value + 1)} className="rounded-lg border border-surface-200 p-3 disabled:opacity-40 dark:border-surface-700"><Plus size={16} /></button><span className="ml-2 text-sm text-surface-500">Subtotal: <strong className="text-ink-900 dark:text-white">{formatCurrency(product.price * quantity)}</strong></span></div>
        <Button size="lg" disabled={!inStock} onClick={addToBill} className="mt-6 w-full sm:w-auto">Add selected quantity to bill</Button>
      </div>
    </div>
  </div>;
}
