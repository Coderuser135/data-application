import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Printer, ReceiptText } from 'lucide-react';
import Button from '@/components/ui/Button';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import { offlineSaleService } from '@/services/offlineSaleService';
import { formatCurrency } from '@/utils/formatters';

export default function AdminSupplementBill() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    offlineSaleService.getById(id).then((data) => { if (active) setSale(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'Bill could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <AdminLoadingSkeleton variant="details" />;
  if (!sale) return <div className="py-16 text-center text-sm text-red-600">{error || 'Bill not found'}<div><Link to="/admin/supplement-selling" className="mt-4 inline-block font-semibold text-brand-600">Back to Supplement Selling</Link></div></div>;

  const date = new Date(sale.created_at);
  const paymentLabel = { cash: 'Cash', upi: 'UPI', card: 'Card', other: 'Other' }[sale.payment_method] || sale.payment_method;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Sale completed</p><h1 className="mt-1 font-display text-2xl font-extrabold text-ink-950 dark:text-white">Supplement Bill</h1></div><div className="flex gap-2"><Button variant="outline" onClick={() => window.print()}><Download size={16} /> Download PDF</Button><Button onClick={() => window.print()}><Printer size={16} /> Print bill</Button></div></div>
    <div className="mx-auto w-full max-w-[80mm] rounded-lg border border-surface-200 bg-white p-4 text-black shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <div className="text-center"><ReceiptText className="mx-auto mb-1" size={25} /><h2 className="text-xl font-extrabold tracking-wide">HEAVEN GYM</h2><p className="text-[11px] font-semibold uppercase tracking-widest">Supplement Store</p><p className="mt-1 text-[10px]">Thank you for your purchase</p></div>
      <div className="my-3 border-y border-dashed border-black py-2 text-[10px]"><div className="flex justify-between gap-2"><span>Bill No.</span><strong>{sale.bill_number}</strong></div><div className="mt-1 flex justify-between gap-2"><span>Date</span><span>{date.toLocaleDateString('en-IN')}</span></div><div className="mt-1 flex justify-between gap-2"><span>Time</span><span>{date.toLocaleTimeString('en-IN')}</span></div>{sale.customer_name && <div className="mt-1 flex justify-between gap-2"><span>Customer</span><span className="max-w-[42mm] text-right">{sale.customer_name}</span></div>}{sale.customer_phone && <div className="mt-1 flex justify-between gap-2"><span>Mobile</span><span>{sale.customer_phone}</span></div>}</div>
      <table className="w-full text-[10px]"><thead><tr className="border-b border-black text-left"><th className="py-1">Item</th><th className="px-1 py-1 text-center">Qty</th><th className="py-1 text-right">Amount</th></tr></thead><tbody>{sale.items.map((item) => <tr key={item.product_id} className="align-top"><td className="py-2 pr-1"><p className="font-semibold">{item.product_name_snapshot}</p><p className="text-[9px]">{formatCurrency(item.product_price_snapshot)} each</p></td><td className="px-1 py-2 text-center">{item.quantity}</td><td className="py-2 text-right">{formatCurrency(item.subtotal)}</td></tr>)}</tbody></table>
      <div className="my-2 border-t border-dashed border-black pt-2 text-[11px]"><div className="flex justify-between font-extrabold"><span>Total</span><span>{formatCurrency(sale.total_amount)}</span></div><div className="mt-1 flex justify-between"><span>Payment</span><span>{paymentLabel}</span></div></div>
      <div className="mt-4 border-t border-dashed border-black pt-3 text-center text-[10px]"><p className="font-bold">Thank you. Visit again!</p><p className="mt-1">Heaven Gym</p></div>
    </div>
    <div className="text-center print:hidden"><Link to="/admin/supplement-selling" className="text-sm font-semibold text-brand-600 hover:underline">Start a new sale</Link></div>
    <style>{`@media print { @page { size: 80mm auto; margin: 4mm; } body { background: #fff !important; } .admin-sidebar, .admin-topbar { display: none !important; } .admin-content { padding: 0 !important; } }`}</style>
  </div>;
}
