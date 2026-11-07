import { useEffect, useMemo, useState } from 'react';
import {
  Search, Dumbbell, Clock3, CalendarClock, Layers3,
  ChevronLeft, ChevronRight, Eye, X, RefreshCw, CalendarDays, Printer,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { membershipService } from '@/services/membershipService';
import { formatCurrency, formatDate, getDaysRemaining } from '@/utils/formatters';

const statusTone = {
  active: 'success', scheduled: 'info', pending: 'warning',
  expired: 'neutral', cancelled: 'danger',
};
const paymentTone = { paid: 'success', pending: 'warning', refunded: 'neutral' };

function Filter({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  const styles = {
    green: { icon: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20', card: '!border-emerald-200/80 !bg-emerald-50/70 dark:!border-emerald-500/20 dark:!bg-emerald-500/[0.08]' },
    amber: { icon: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20', card: '!border-amber-200/80 !bg-amber-50/70 dark:!border-amber-500/20 dark:!bg-amber-500/[0.08]' },
    blue: { icon: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20', card: '!border-blue-200/80 !bg-blue-50/70 dark:!border-blue-500/20 dark:!bg-blue-500/[0.08]' },
    slate: { icon: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600', card: '!border-slate-200 !bg-white dark:!border-slate-700 dark:!bg-slate-900' },
  };
  const palette = styles[tone] || styles.slate;
  return (
    <Card className={`${palette.card} shadow-[0_3px_14px_rgba(15,23,42,0.05)]`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.icon}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{value}</p>
    </Card>
  );
}

function DetailLine({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="break-words text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-right">{value || '—'}</span>
    </div>
  );
}

function escapeReceiptText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatReceiptDateTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Not available';
}

function printPaymentReceipt(payment, membership) {
  if (payment.status !== 'success') return;
  const receiptWindow = window.open('', '_blank', 'width=820,height=900');
  if (!receiptWindow) {
    window.alert('Please allow pop-ups to print the payment receipt.');
    return;
  }

  const safe = escapeReceiptText;
  const receiptNumber = `IF-${String(payment._id || '').slice(-10).toUpperCase() || 'RECEIPT'}`;
  const transactionReference = payment.razorpay_payment_id || payment.transaction_id || payment.reference_note || 'Not provided';
  const paymentDate = formatReceiptDateTime(payment.payment_date || payment.createdAt);
  const membershipType = membership.membership_type === 'renewal' ? 'Renewal' : 'First membership';
  const paymentMethod = String(payment.payment_method || 'online').toUpperCase();
  const paymentType = String(payment.payment_type || 'membership').replaceAll('_', ' ');

  receiptWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"><title>Payment Receipt - ${safe(receiptNumber)}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;padding:28px;background:#eef2f7;color:#172033;font-family:Arial,Helvetica,sans-serif}
    .sheet{max-width:760px;margin:0 auto;background:#fff;border:1px solid #dbe2ea;border-radius:18px;overflow:hidden}
    .brand{padding:28px 32px;background:#111827;color:#fff;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
    .brand h1{margin:0;font-size:26px;letter-spacing:1px}.brand p{margin:7px 0 0;color:#cbd5e1;font-size:12px}
    .meta{text-align:right;font-size:12px;line-height:1.8;color:#e2e8f0}.meta strong{display:block;color:#fff;font-size:14px}
    .content{padding:28px 32px}.status{display:inline-block;padding:7px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:800;letter-spacing:.7px}
    .amount-box{margin:18px 0 24px;padding:20px;border:1px solid #bbf7d0;border-radius:14px;background:#f0fdf4}
    .amount-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px}.amount{margin-top:6px;font-size:34px;font-weight:800;color:#166534}
    .section{margin-top:24px}.section h2{margin:0 0 12px;font-size:13px;color:#111827}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 24px;border-top:1px solid #e8edf3}
    .line{display:flex;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #e8edf3;font-size:12px}
    .line span{color:#64748b}.line strong{text-align:right;color:#1e293b;overflow-wrap:anywhere}
    .notice{margin-top:24px;padding:13px 15px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:11px;line-height:1.6}
    .footer{padding:18px 32px;border-top:1px solid #e8edf3;text-align:center;color:#64748b;font-size:11px}
    .actions{max-width:760px;margin:14px auto 0;display:flex;justify-content:flex-end}.print{border:0;border-radius:9px;padding:11px 18px;background:#b91c1c;color:#fff;font-weight:700;cursor:pointer}
    @media(max-width:560px){body{padding:0;background:#fff}.sheet{border:0;border-radius:0}.brand,.content{padding:22px 18px}.grid{grid-template-columns:1fr}.amount{font-size:29px}}
    @media print{body{padding:0;background:#fff}.sheet{max-width:none;border:0;border-radius:0}.actions{display:none}.brand,.amount-box,.status,.notice{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <main class="sheet">
    <header class="brand"><div><h1>HEAVEN GYM</h1><p>GYM MEMBERSHIP · PAYMENT RECEIPT</p></div>
      <div class="meta"><strong>RECEIPT</strong>No. ${safe(receiptNumber)}<br>Issued: ${safe(paymentDate)}</div>
    </header>
    <div class="content"><span class="status">PAYMENT SUCCESSFUL</span>
      <div class="amount-box"><div class="amount-label">Amount received</div><div class="amount">${safe(formatCurrency(payment.amount))}</div></div>
      <section class="section"><h2>MEMBER DETAILS</h2><div class="grid">
        <div class="line"><span>Member name</span><strong>${safe(membership.user_id?.full_name || '—')}</strong></div>
        <div class="line"><span>Member ID</span><strong>${safe(membership.gym_admission_id?.member_id || '—')}</strong></div>
        <div class="line"><span>Email</span><strong>${safe(membership.user_id?.email || '—')}</strong></div>
        <div class="line"><span>Phone</span><strong>${safe(membership.user_id?.phone || '—')}</strong></div>
      </div></section>
      <section class="section"><h2>MEMBERSHIP DETAILS</h2><div class="grid">
        <div class="line"><span>Plan</span><strong>${safe(membership.plan_name_snapshot || '—')}</strong></div>
        <div class="line"><span>Membership type</span><strong>${safe(membershipType)}</strong></div>
        <div class="line"><span>Plan price</span><strong>${safe(formatCurrency(membership.plan_price_snapshot))}</strong></div>
        <div class="line"><span>Duration</span><strong>${safe(`${membership.duration_days || '—'} days`)}</strong></div>
        <div class="line"><span>Start date</span><strong>${safe(formatDate(membership.start_date))}</strong></div>
        <div class="line"><span>Expiry date</span><strong>${safe(formatDate(membership.end_date))}</strong></div>
        <div class="line"><span>Membership ID</span><strong>${safe(membership._id || '—')}</strong></div>
        <div class="line"><span>Payment category</span><strong>${safe(paymentType)}</strong></div>
      </div></section>
      <section class="section"><h2>PAYMENT DETAILS</h2><div class="grid">
        <div class="line"><span>Payment status</span><strong>SUCCESS</strong></div>
        <div class="line"><span>Payment method</span><strong>${safe(paymentMethod)}</strong></div>
        <div class="line"><span>Payment date & time</span><strong>${safe(paymentDate)}</strong></div>
        <div class="line"><span>Transaction reference</span><strong>${safe(transactionReference)}</strong></div>
        <div class="line"><span>Payment record ID</span><strong>${safe(payment._id || '—')}</strong></div>
        <div class="line"><span>Gateway order ID</span><strong>${safe(payment.razorpay_order_id || '—')}</strong></div>
      </div></section>
      <div class="notice">This receipt confirms the successful payment recorded by HEAVEN GYM. Please retain it for your records. For payment queries, share the receipt number or transaction reference with the gym.</div>
    </div><footer class="footer">Thank you for being a part of HEAVEN GYM.</footer>
  </main><div class="actions"><button class="print" onclick="window.print()">Print / Save as PDF</button></div>
  </body></html>`);
  receiptWindow.document.close();
}
function MembershipDetails({ membership, loading, error, onClose }) {
  if (!membership && !loading) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-sm p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="membership-detail-title" className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div><h2 id="membership-detail-title" className="font-display text-lg font-bold text-slate-950 dark:text-white">Membership Details</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Membership record and linked payment transactions</p></div>
          <button onClick={onClose} aria-label="Close details" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {loading ? <AdminLoadingSkeleton variant="details" /> : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>
          ) : membership ? (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"><Dumbbell size={20}/></span><div><h3 className="font-bold text-slate-950 dark:text-white">{membership.plan_name_snapshot}</h3><p className="text-xs text-slate-500 dark:text-slate-400">{membership.user_id?.full_name || 'Unknown member'}</p></div></div>
                  <Badge tone={statusTone[membership.effective_status] || 'neutral'}>{membership.effective_status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[11px] text-slate-500">Plan price</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(membership.plan_price_snapshot)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[11px] text-slate-500">Advance paid</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(membership.advance_paid)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[11px] text-slate-500">Amount due</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(membership.amount_due)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[11px] text-slate-500">Duration</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{membership.duration_days} days</p></div>
                </div>
              </Card>
              <Card>
                <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Member & membership information</h3>
                <DetailLine label="Member name" value={membership.user_id?.full_name}/>
                <DetailLine label="Email" value={membership.user_id?.email}/>
                <DetailLine label="Phone" value={membership.user_id?.phone}/>
                <DetailLine label="Member ID" value={membership.gym_admission_id?.member_id}/>
                <DetailLine label="Membership ID" value={membership._id}/>
                <DetailLine label="Record type" value={membership.membership_type === 'renewal' ? 'Renewal' : 'Initial membership'}/>
                <DetailLine label="Start date" value={formatDate(membership.start_date)}/>
                <DetailLine label="Expiry date" value={formatDate(membership.end_date)}/>
                <DetailLine label="Payment status" value={<Badge tone={paymentTone[membership.payment_status] || 'neutral'}>{membership.payment_status || 'unknown'}</Badge>}/>
                <DetailLine label="Created" value={formatDate(membership.createdAt)}/>
              </Card>
              <Card>
                <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment transactions</h3><Badge>{membership.payments?.length || 0} records</Badge></div>
                {membership.payments?.length ? <div className="space-y-2">{membership.payments.map((payment) => (
                  <div key={payment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(payment.amount)} · {String(payment.payment_type || '').replaceAll('_', ' ')}</p><p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{payment.transaction_id || payment.razorpay_payment_id || payment.reference_note || 'No reference'} · {formatDate(payment.payment_date || payment.createdAt)}</p></div>
                    <div className="flex items-center gap-2"><Badge tone={paymentTone[payment.status] || (payment.status === 'failed' ? 'danger' : 'neutral')}>{payment.status}</Badge>{payment.status === 'success' ? <Button size="sm" variant="outline" onClick={() => printPaymentReceipt(payment, membership)}><Printer size={13}/> Receipt</Button> : null}</div>
                  </div>
                ))}</div> : <p className="text-sm text-slate-500 dark:text-slate-400">No payment transactions are linked to this membership.</p>}
              </Card>

            </>
          ) : null}
        </div>
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-right dark:border-slate-800 dark:bg-slate-900"><Button variant="outline" onClick={onClose}>Close</Button></footer>
      </section>
    </div>,
    document.body,
  );
}

export default function AdminMemberships() {
  const [data, setData] = useState({ rows: [], total: 0, page: 1, pages: 1, plans: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [expiry, setExpiry] = useState('all');
  const [plan, setPlan] = useState('all');
  const [membershipType, setMembershipType] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  async function loadMemberships(showRefresh = false) {
    showRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const result = await membershipService.getAll({ search, status, paymentStatus, expiry, plan, membershipType, page, limit });
      setData(result);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Membership records could not be loaded. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadMemberships(), 250);
    return () => clearTimeout(timer);
  }, [search, status, paymentStatus, expiry, plan, membershipType, page, limit]);

  async function openDetails(item) {
    setSelected({ _id: item._id });
    setDetailError('');
    setDetailLoading(true);
    try {
      const result = await membershipService.getDetails(item._id);
      setSelected(result);
    } catch (requestError) {
      setDetailError(requestError?.response?.data?.error || 'Unable to load membership details.');
    } finally {
      setDetailLoading(false);
    }
  }


  const pages = Math.max(1, Number(data.pages) || 1);
  const start = data.total ? ((page - 1) * limit) + 1 : 0;
  const end = Math.min(page * limit, data.total || 0);
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(page - 2, pages - 4));
    return Array.from({ length: Math.min(5, pages) }, (_, index) => first + index);
  }, [page, pages]);

  function changeFilter(setter, value) { setter(value); setPage(1); }
  function clearFilters() {
    setSearch(''); setStatus('all'); setPaymentStatus('all'); setExpiry('all'); setPlan('all'); setMembershipType('all'); setPage(1);
  }

  if (loading && !data.rows.length) return <div className="space-y-5"><AdminLoadingSkeleton variant="cards" rows={4}/><AdminLoadingSkeleton variant="table" rows={6}/></div>;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Membership Management</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">View membership records, renewals, expiry and payment history</p></div>
        <Button variant="outline" onClick={() => loadMemberships(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Total memberships" value={data.stats?.total ?? 0} icon={Layers3} tone="blue"/>
        <SummaryCard label="Active" value={data.stats?.active ?? 0} icon={Dumbbell} tone="green"/>
        <SummaryCard label="Expiring in 7 days" value={data.stats?.expiringSoon ?? 0} icon={CalendarClock} tone="amber"/>
        <SummaryCard label="Pending" value={data.stats?.pending ?? 0} icon={Clock3} tone="amber"/>
        <SummaryCard label="Expired" value={data.stats?.expired ?? 0} icon={CalendarDays} tone="slate"/>
      </div>

      <Card className="!border-slate-200 !bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)] dark:!border-slate-700 dark:!bg-slate-900">
        <div className="space-y-3">
          <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Search member name, email or phone..." className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"/></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Filter label="Membership status" value={status} onChange={(value) => changeFilter(setStatus, value)} options={[{value:'all',label:'All statuses'},{value:'active',label:'Active'},{value:'scheduled',label:'Scheduled'},{value:'pending',label:'Pending'},{value:'expired',label:'Expired'},{value:'cancelled',label:'Cancelled'}]}/>
            <Filter label="Payment status" value={paymentStatus} onChange={(value) => changeFilter(setPaymentStatus, value)} options={[{value:'all',label:'All payment states'},{value:'paid',label:'Paid'},{value:'pending',label:'Pending'},{value:'refunded',label:'Refunded'}]}/>
            <Filter label="Expiry" value={expiry} onChange={(value) => changeFilter(setExpiry, value)} options={[{value:'all',label:'Any expiry date'},{value:'today',label:'Expires today'},{value:'7',label:'Next 7 days'},{value:'30',label:'Next 30 days'},{value:'expired',label:'Already expired'}]}/>
            <Filter label="Plan" value={plan} onChange={(value) => changeFilter(setPlan, value)} options={[{value:'all',label:'All plans'},...(data.plans || []).map((item) => ({value:item._id,label:item.name}))]}/>
            <Filter label="Membership type" value={membershipType} onChange={(value) => changeFilter(setMembershipType, value)} options={[{value:'all',label:'All memberships'},{value:'initial',label:'First membership'},{value:'renewal',label:'Renewals'}]}/>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">{data.total || 0} matching membership records</p>
            <div className="flex items-center gap-3"><label className="text-xs font-medium text-slate-600 dark:text-slate-300">Rows <select value={limit} onChange={(event) => {setLimit(Number(event.target.value));setPage(1);}} className="ml-2 min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label><button onClick={clearFilters} className="text-xs font-bold text-brand-700 hover:underline dark:text-brand-300">Clear filters</button></div>
          </div>
        </div>
      </Card>

      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div> : null}

      {loading ? <AdminLoadingSkeleton variant="table" rows={6}/> : data.rows.length ? (
        <>
          <Card padding={false} className="!overflow-hidden !border-slate-200 !bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)] dark:!border-slate-700 dark:!bg-slate-900">
            <div className="admin-table-scroll w-full min-w-0" style={{ display: 'block', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}><table className="admin-data-table text-sm" style={{ width: '1100px', minWidth: '1100px', maxWidth: 'none', tableLayout: 'auto' }}>
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"><th className="px-4 py-4">Member</th><th className="px-4 py-4">Plan</th><th className="px-4 py-4">Price / Due</th><th className="px-4 py-4">Start / End</th><th className="px-4 py-4">Days left</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Payment</th><th className="px-4 py-4 text-right">Action</th></tr></thead>
              <tbody>{data.rows.map((item) => { const effective = item.effective_status || item.status; return (
                <tr key={item._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-4"><p className="font-bold text-slate-900 dark:text-white">{item.user_id?.full_name || 'Unknown member'}</p><p className="mt-1 text-xs text-slate-500">{item.user_id?.email || item.user_id?.phone || '—'}</p></td>
                  <td className="px-4 py-4"><p className="font-semibold text-slate-800 dark:text-slate-200">{item.plan_name_snapshot}</p><p className="mt-1 text-xs text-slate-500">{item.duration_days} days</p></td>
                  <td className="px-4 py-4"><p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(item.plan_price_snapshot)}</p><p className="mt-1 text-xs text-slate-500">Due: {formatCurrency(item.amount_due)}</p></td>
                  <td className="px-4 py-4"><p className="text-slate-800 dark:text-slate-200">{formatDate(item.start_date)}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.end_date)}</p></td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{effective === 'active' && item.end_date ? getDaysRemaining(item.end_date) : '—'}</td>
                  <td className="px-4 py-4"><Badge tone={statusTone[effective] || 'neutral'}>{effective}</Badge></td>
                  <td className="px-4 py-4"><Badge tone={paymentTone[item.payment_status] || 'neutral'}>{item.payment_status || 'unknown'}</Badge></td>
                  <td className="px-4 py-4 text-right"><Button size="sm" variant="outline" onClick={() => openDetails(item)}><Eye size={14}/> Details</Button></td>
                </tr>
              );})}</tbody>
            </table></div>
          </Card>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Showing <strong className="text-slate-800 dark:text-slate-200">{start}-{end}</strong> of <strong className="text-slate-800 dark:text-slate-200">{data.total}</strong></p>
            <div className="flex items-center justify-between gap-1 sm:justify-end"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ChevronLeft size={15}/> Previous</button>{pageNumbers.map((number) => <button key={number} onClick={() => setPage(number)} className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold ${page === number ? 'bg-red-700 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>{number}</button>)}<button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">Next <ChevronRight size={15}/></button></div>
          </div>
        </>
      ) : <EmptyState title="No memberships found" description="Try changing your search or filters. Membership records will appear here when customers purchase a plan."/>}

      <MembershipDetails membership={selected} loading={detailLoading} error={detailError} onClose={() => {setSelected(null);setDetailError('');}}/>
    </div>
  );
}
