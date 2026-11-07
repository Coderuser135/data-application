import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Dumbbell, Store, TrendingUp, RotateCcw, Search, AlertTriangle, X, ReceiptText } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchAllPayments } from '@/redux/slices/paymentSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';

const STATUSES = ['all', 'success', 'pending', 'failed', 'reconciliation_required'];
const TYPES = ['all', 'membership_advance', 'membership_installment', 'membership_full', 'order'];
const STATUS_LABELS = { reconciliation_required: 'Reconciliation required', success: 'Successful', pending: 'Pending', failed: 'Failed' };
const TYPE_LABELS = { membership_advance: 'Membership advance', membership_installment: 'Membership installment', membership_full: 'Membership payment', order: 'Supplement order' };

function SummaryCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const styles = {
    neutral: { icon: 'bg-surface-100 text-surface-600 dark:bg-surface-800', card: '' },
    teal: { icon: 'bg-teal-500/10 text-teal-700 dark:text-teal-400', card: '!border-teal-200/80 !bg-teal-50/70 dark:!border-teal-500/20 dark:!bg-teal-500/[0.08]' },
    blue: { icon: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', card: '!border-blue-200/80 !bg-blue-50/70 dark:!border-blue-500/20 dark:!bg-blue-500/[0.08]' },
    green: { icon: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', card: '!border-emerald-200/80 !bg-emerald-50/70 dark:!border-emerald-500/20 dark:!bg-emerald-500/[0.08]' },
    amber: { icon: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', card: '!border-amber-200/80 !bg-amber-50/70 dark:!border-amber-500/20 dark:!bg-amber-500/[0.08]' },
    red: { icon: 'bg-red-500/10 text-red-700 dark:text-red-400', card: '!border-red-200/80 !bg-red-50/70 dark:!border-red-500/20 dark:!bg-red-500/[0.08]' },
  };
  const palette = styles[tone] || styles.neutral;
  return <Card className={palette.card}><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}><Icon size={19} /></span><p className="mt-4 text-xs text-surface-500">{label}</p><p className="mt-1 font-display text-xl font-bold text-ink-950 dark:text-white">{value}</p></Card>;
}

export default function AdminPayments() {
  const dispatch = useDispatch();
  const { adminItems, adminPagination, adminSummary, loading, error } = useSelector((state) => state.payments);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(fetchAllPayments({ search, status, type, page, limit }));
  }, [dispatch, search, status, type, page, limit]);

  const totalPages = Math.max(1, Number(adminPagination?.pages) || 1);
  const total = Number(adminPagination?.total) || 0;
  const firstItem = total ? (page - 1) * limit + 1 : 0;
  const lastItem = Math.min(page * limit, total);
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index);
  }, [page, totalPages]);
  const summary = adminSummary || {};

  const statusTone = (value) => value === 'success' ? 'success' : value === 'pending' || value === 'reconciliation_required' ? 'warning' : 'danger';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Payments</h1><p className="mt-1 text-sm text-surface-500">Track transactions, payment status and revenue.</p></div>
        <Button variant="outline" onClick={() => dispatch(fetchAllPayments({ search, status, type, page, limit }))}><RotateCcw size={15} /> Refresh</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard icon={Dumbbell} label="Gym revenue" value={formatCurrency(summary.gymRevenue || 0)} tone="green" />
        <SummaryCard icon={Store} label="Store revenue" value={formatCurrency(summary.storeRevenue || 0)} tone="blue" />
        <SummaryCard icon={IndianRupee} label="Gross successful revenue" value={formatCurrency((summary.gymRevenue || 0) + (summary.storeRevenue || 0))} tone="green" />
        <SummaryCard icon={TrendingUp} label="Pending transactions" value={summary.pending || 0} tone="amber" />
        <SummaryCard icon={AlertTriangle} label="Needs reconciliation" value={summary.reconciliationRequired || 0} tone="red" />
      </div>
      

      <Card>
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_200px_220px]">
          <div className="relative"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search customer or transaction ID..." className="min-h-11 w-full rounded-xl border border-surface-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" /></div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by payment status" className="min-h-11 rounded-xl border border-surface-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white">{STATUSES.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : STATUS_LABELS[value]}</option>)}</select>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Filter by payment type" className="min-h-11 rounded-xl border border-surface-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white">{TYPES.map((value) => <option key={value} value={value}>{value === 'all' ? 'All payment types' : TYPE_LABELS[value]}</option>)}</select>
        </div>
      </Card>

      {loading && adminItems.length === 0 ? <AdminLoadingSkeleton variant="table" rows={6} /> : error ? <Card><p role="alert" className="text-sm text-red-600">{error}</p><Button className="mt-3" onClick={() => dispatch(fetchAllPayments({ search, status, type, page, limit }))}>Try again</Button></Card> : adminItems.length > 0 ? (
        <Card padding={false}>
          <div className="flex items-center justify-between gap-3 border-b border-surface-200 px-5 py-4 dark:border-surface-800"><div><h2 className="font-semibold text-ink-950 dark:text-white">Transaction history</h2><p className="mt-1 text-xs text-surface-500">{total} matching transactions</p></div><span className="text-xs text-surface-500">{loading ? 'Updating…' : 'Latest first'}</span></div>
          <div className="admin-table-scroll w-full min-w-0" style={{ display: 'block', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
            <table className="admin-data-table text-sm" style={{ width: '1120px', minWidth: '1120px', maxWidth: 'none', tableLayout: 'auto' }}>
              <thead><tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800"><th className="px-5 py-4 font-medium">Transaction ID</th><th className="px-5 py-4 font-medium">Customer</th><th className="px-5 py-4 font-medium">Type</th><th className="px-5 py-4 font-medium">Method</th><th className="px-5 py-4 font-medium">Amount</th><th className="px-5 py-4 font-medium">Date</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 text-right font-medium">Details</th></tr></thead>
              <tbody>{adminItems.map((payment) => <tr key={payment._id || payment.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800"><td data-label="Transaction ID" className="max-w-[220px] truncate px-5 py-4 font-mono text-xs">{payment.transaction_id || payment.razorpay_payment_id || payment.razorpay_order_id || '—'}</td><td data-label="Customer" className="px-5 py-4"><p className="font-medium text-ink-900 dark:text-white">{payment.user_id?.full_name || '—'}</p><p className="text-xs text-surface-500">{payment.user_id?.email || ''}</p></td><td data-label="Type" className="px-5 py-4">{TYPE_LABELS[payment.payment_type] || payment.payment_type || '—'}</td><td data-label="Method" className="px-5 py-4 capitalize">{payment.payment_method || '—'}</td><td data-label="Amount" className="px-5 py-4 font-semibold">{formatCurrency(payment.amount)}</td><td data-label="Date" className="px-5 py-4 whitespace-nowrap text-surface-500">{formatDate(payment.payment_date || payment.createdAt || payment.created_at)}</td><td data-label="Status" className="px-5 py-4"><Badge tone={statusTone(payment.status)}>{STATUS_LABELS[payment.status] || payment.status}</Badge></td><td data-label="Details" className="px-5 py-4 text-right"><Button size="sm" variant="ghost" onClick={() => setSelectedPayment(payment)}>View</Button></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      ) : <EmptyState title="No payments found" description="Try another search or change the selected filters." />}

      <div className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3"><p className="text-xs text-surface-500">Showing <strong className="text-ink-900 dark:text-white">{firstItem}–{lastItem}</strong> of <strong className="text-ink-900 dark:text-white">{total}</strong> transactions</p><label className="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-300">Rows<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="min-h-9 rounded-lg border border-surface-300 bg-white px-2 text-xs dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></div>
        <div className="flex flex-wrap items-center gap-1"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="min-h-9 rounded-lg border border-surface-300 px-3 text-xs font-semibold disabled:opacity-40 dark:border-surface-700">‹ Previous</button>{pageNumbers.map((number) => <button key={number} type="button" aria-current={page === number ? 'page' : undefined} disabled={loading} onClick={() => setPage(number)} className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold ${page === number ? 'bg-brand-600 text-white' : 'border border-surface-300 dark:border-surface-700'}`}>{number}</button>)}<button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="min-h-9 rounded-lg border border-surface-300 px-3 text-xs font-semibold disabled:opacity-40 dark:border-surface-700">Next ›</button></div>
      </div>

      {selectedPayment && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedPayment(null)}><div role="dialog" aria-modal="true" aria-label="Payment details" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-surface-900" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800"><div className="flex items-center gap-2"><ReceiptText size={18} /><h2 className="font-semibold">Payment details</h2></div><button onClick={() => setSelectedPayment(null)} aria-label="Close details" className="rounded-lg p-2 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18} /></button></div><div className="space-y-4 p-5"><div className="flex items-center justify-between"><span className="text-sm text-surface-500">Status</span><Badge tone={statusTone(selectedPayment.status)}>{STATUS_LABELS[selectedPayment.status] || selectedPayment.status}</Badge></div>{[['Customer', selectedPayment.user_id?.full_name], ['Email', selectedPayment.user_id?.email], ['Amount', formatCurrency(selectedPayment.amount)], ['Payment type', TYPE_LABELS[selectedPayment.payment_type] || selectedPayment.payment_type], ['Method', selectedPayment.payment_method], ['Transaction ID', selectedPayment.transaction_id || '—'], ['Razorpay payment ID', selectedPayment.razorpay_payment_id || '—'], ['Razorpay order ID', selectedPayment.razorpay_order_id || '—'], ['Date', formatDate(selectedPayment.payment_date || selectedPayment.createdAt || selectedPayment.created_at)]].map(([label, value]) => <div key={label} className="flex flex-col gap-1 border-b border-surface-100 pb-3 text-sm dark:border-surface-800 sm:flex-row sm:justify-between"><span className="text-surface-500">{label}</span><span className="break-all font-medium text-ink-900 dark:text-white sm:max-w-[65%] sm:text-right">{value || '—'}</span></div>)}{selectedPayment.reference_note && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"><strong>Admin note:</strong> {selectedPayment.reference_note}</div>}</div></div></div>}
    </div>
  );
}
