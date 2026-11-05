import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Users, UserCheck, UserX, CreditCard, X, Phone, MessageCircle,
  CalendarDays, Dumbbell, ExternalLink, Mail, MapPin, Clock3,
} from 'lucide-react';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { admissionService } from '@/services/admissionService';
import { formatDate, formatCurrency } from '@/utils/formatters';

function StatPill({ icon: Icon, label, value, tone }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
    info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600',
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300 sm:text-sm">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function StatusBadge({ value }) {
  const map = {
    active: ['success', 'Active'],
    admitted: ['success', 'Admitted'],
    paid: ['success', 'Paid'],
    success: ['success', 'Successful'],
    expired: ['warning', 'Expired'],
    not_admitted: ['warning', 'Not admitted'],
    not_purchased: ['neutral', 'Not purchased'],
    none: ['neutral', 'No payment'],
    pending: ['warning', 'Pending'],
    scheduled: ['info', 'Scheduled'],
    failed: ['danger', 'Failed'],
    refunded: ['neutral', 'Refunded'],
    cancelled: ['neutral', 'Cancelled'],
    inactive: ['neutral', 'Inactive'],
  };
  const [tone, label] = map[value] || ['neutral', value || 'Unknown'];
  return <Badge tone={tone}>{label}</Badge>;
}

function DetailSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {children}
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="break-words text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-right">{value || '—'}</span>
    </div>
  );
}

function MemberProfileDrawer({ member, overview, loading, error, onClose }) {
  if (!member) return null;
  const user = overview?.user || member;
  const phone = String(user.phone || '').replace(/[^0-9+]/g, '');
  const whatsappNumber = phone.replace(/^\+/, '').replace(/^0/, '');
  const whatsappText = encodeURIComponent(`Hello ${user.full_name || 'there'}, this is IronForge Gym. We are contacting you regarding your gym account.`);
  const money = (value) => formatCurrency(Number(value || 0));

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="member-profile-title" className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="min-w-0">
            <h2 id="member-profile-title" className="truncate font-display text-lg font-bold text-slate-950 dark:text-white sm:text-xl">Member Profile</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Customer account, gym activity and transaction history</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close member profile" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><X size={20} /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-lg font-extrabold text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-slate-950 dark:text-white">{user.full_name || 'Unnamed customer'}</h3>
                <p className="break-all text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{member.member_id || 'No member ID yet'}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {phone ? <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"><Phone size={16} /> Call</a> : <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-400">No phone number</span>}
              {whatsappNumber ? <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><MessageCircle size={16} /> WhatsApp</a> : <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-400">No WhatsApp number</span>}
              {whatsappNumber ? <a href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700"><ExternalLink size={16} /> Send message</a> : null}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">WhatsApp opens a chat with a prepared message. Admin reviews and sends it manually.</p>
          </section>

          {loading ? <AdminLoadingSkeleton variant="cards" rows={4} /> : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill icon={Dumbbell} label="Memberships" value={overview.summary?.totalMemberships ?? 0} tone="info" />
                <StatPill icon={UserCheck} label="Active" value={overview.summary?.activeMemberships ?? 0} tone="success" />
                <StatPill icon={CreditCard} label="Successful payments" value={overview.summary?.successfulPayments ?? 0} tone="success" />
                <StatPill icon={Clock3} label="Pending payments" value={overview.summary?.pendingPayments ?? 0} tone="warning" />
              </div>

              <DetailSection title="Account information">
                <DetailRow label="Registered" value={formatDate(user.createdAt)} />
                <DetailRow label="Email verification" value={user.email_verified ? 'Verified' : 'Not verified'} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Phone" value={user.phone} />
                <DetailRow label="Address" value={user.address} />
              </DetailSection>

              <DetailSection title="Gym admission">
                {overview.admission ? <>
                  <DetailRow label="Member ID" value={overview.admission.member_id} />
                  <DetailRow label="Admission date" value={formatDate(overview.admission.admission_date || overview.admission.createdAt)} />
                  <DetailRow label="Admission status" value={<StatusBadge value={overview.admission.status} />} />
                  <DetailRow label="Emergency contact" value={overview.admission.emergency_contact_name} />
                  <DetailRow label="Emergency phone" value={overview.admission.emergency_contact_phone} />
                </> : <p className="text-sm text-slate-500 dark:text-slate-400">No admission record found.</p>}
              </DetailSection>

              <DetailSection title="Membership history">
                {overview.memberships?.length ? <div className="space-y-3">
                  {overview.memberships.map((item) => (
                    <div key={item._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.plan_name_snapshot || 'Membership plan'}</p>
                        <StatusBadge value={item.effective_status} />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div><p className="text-slate-500">Price</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{money(item.plan_price_snapshot)}</p></div>
                        <div><p className="text-slate-500">Payment</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{item.payment_status || '—'}</p></div>
                        <div><p className="text-slate-500">Start</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatDate(item.start_date)}</p></div>
                        <div><p className="text-slate-500">Expires</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatDate(item.end_date)}</p></div>
                      </div>
                    </div>
                  ))}
                </div> : <p className="text-sm text-slate-500 dark:text-slate-400">No membership purchase records found.</p>}
              </DetailSection>

              <DetailSection title="Payment history">
                {overview.payments?.length ? <div className="space-y-2">
                  {overview.payments.map((payment) => (
                    <div key={payment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{money(payment.amount)} · {String(payment.payment_type || 'payment').replaceAll('_', ' ')}</p>
                        <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{payment.transaction_id || payment.razorpay_payment_id || payment.reference_note || 'No transaction reference'} · {formatDate(payment.payment_date || payment.createdAt)}</p>
                      </div>
                      <StatusBadge value={payment.status} />
                    </div>
                  ))}
                </div> : <p className="text-sm text-slate-500 dark:text-slate-400">No payment records found.</p>}
              </DetailSection>

              <DetailSection title="Store orders">
                {overview.orders?.length ? <div className="space-y-2">
                  {overview.orders.map((order) => (
                    <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div><p className="text-sm font-bold text-slate-900 dark:text-white">{order.order_number}</p><p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)} · {money(order.total_amount)}</p></div>
                      <div className="flex gap-2"><StatusBadge value={order.status} /><StatusBadge value={order.payment_status} /></div>
                    </div>
                  ))}
                </div> : <p className="text-sm text-slate-500 dark:text-slate-400">No store orders found.</p>}
              </DetailSection>
            </>
          ) : null}
        </div>
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-right dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <Button variant="outline" onClick={onClose}>Close profile</Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState({ rows: [], total: 0, page: 1, pages: 1, stats: { totalUsers: 0, admitted: 0, notAdmitted: 0 } });
  const [loading, setLoading] = useState(true);
  const [admissionFilter, setAdmissionFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [registeredWithin, setRegisteredWithin] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await admissionService.searchUsers(query, page, limit, {
          admissionFilter, paymentFilter, membershipFilter, registeredWithin,
        });
        if (active) setResults(res);
      } catch {
        if (active) setResults({ rows: [], total: 0, page: 1, pages: 1, stats: { totalUsers: 0, admitted: 0, notAdmitted: 0 } });
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, page, limit, admissionFilter, paymentFilter, membershipFilter, registeredWithin]);

  async function openMember(member) {
    setSelectedMember(member);
    setOverview(null);
    setOverviewError('');
    setOverviewLoading(true);
    try {
      const data = await admissionService.getMemberOverview(member._id);
      setOverview(data);
    } catch (error) {
      setOverviewError(error?.response?.data?.error || error?.message || 'Unable to load member details.');
    } finally {
      setOverviewLoading(false);
    }
  }

  const rows = results.rows || [];
  const pageCount = Math.max(1, Number(results.pages) || 1);
  const firstPageNumber = Math.max(1, Math.min(page - 2, pageCount - 4));
  const visiblePages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPageNumber + index);
  const startItem = results.total === 0 ? 0 : ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, results.total);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Member Management</h1>
        <p className="mt-1 text-sm text-surface-500">Customer accounts, gym admissions, memberships and payments in one place</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatPill icon={Users} label="Total Customers" value={results.stats?.totalUsers ?? results.total} tone="info" />
        <StatPill icon={UserCheck} label="Admitted" value={results.stats?.admitted ?? 0} tone="success" />
        <StatPill icon={UserX} label="Not Admitted" value={results.stats?.notAdmitted ?? 0} tone="warning" />
        <StatPill icon={CreditCard} label="Filtered Results" value={results.total} tone="neutral" />
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="relative min-w-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search name, email, phone or member ID..."
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect label="Admission" value={admissionFilter} onChange={(value) => { setAdmissionFilter(value); setPage(1); }} options={[{ value: 'all', label: 'All admissions' }, { value: 'admitted', label: 'Admitted' }, { value: 'not_admitted', label: 'Not admitted' }]} />
            <FilterSelect label="Payment" value={paymentFilter} onChange={(value) => { setPaymentFilter(value); setPage(1); }} options={[{ value: 'all', label: 'All payment states' }, { value: 'success', label: 'Successful' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }, { value: 'none', label: 'No payment record' }]} />
            <FilterSelect label="Membership" value={membershipFilter} onChange={(value) => { setMembershipFilter(value); setPage(1); }} options={[{ value: 'all', label: 'All memberships' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'pending', label: 'Pending' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'not_purchased', label: 'Not purchased' }]} />
            <FilterSelect label="Registration" value={registeredWithin} onChange={(value) => { setRegisteredWithin(value); setPage(1); }} options={[{ value: 'all', label: 'Any time' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }]} />
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => { setAdmissionFilter('all'); setPaymentFilter('all'); setMembershipFilter('all'); setRegisteredWithin('all'); setQuery(''); setPage(1); }} className="self-start text-xs font-bold text-brand-700 hover:underline dark:text-brand-300">Clear all filters</button>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Rows per page
              <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white">
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      {loading ? <AdminLoadingSkeleton variant="table" rows={limit === 5 ? 5 : 6} /> : rows.length ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="admin-mobile-cards w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="px-4 py-4">Customer</th><th className="px-4 py-4">Contact</th><th className="px-4 py-4">Admission</th><th className="px-4 py-4">Membership</th><th className="px-4 py-4">Latest payment</th><th className="px-4 py-4">Registered</th><th className="px-4 py-4">Profile</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <tr key={member._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td data-label="Customer" className="px-4 py-4">
                      <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-extrabold text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300">{member.full_name?.charAt(0)?.toUpperCase() || '?'}</span><span className="font-semibold text-slate-900 dark:text-white">{member.full_name || '—'}</span></div>
                      <p className="mt-1 pl-12 font-mono text-[11px] text-slate-500">{member.member_id || 'No member ID'}</p>
                    </td>
                    <td data-label="Contact" className="max-w-xs px-4 py-4"><p className="break-all font-medium text-slate-800 dark:text-slate-200">{member.email}</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{member.phone || 'No phone'}</p></td>
                    <td data-label="Admission" className="px-4 py-4"><StatusBadge value={member.is_admitted ? member.admission_status || 'admitted' : 'not_admitted'} /></td>
                    <td data-label="Membership" className="px-4 py-4"><StatusBadge value={member.membership_status} /><p className="mt-1 text-xs text-slate-500">{member.membership_plan || 'No plan'}</p></td>
                    <td data-label="Latest payment" className="px-4 py-4"><StatusBadge value={member.payment_status} />{member.latest_payment_amount !== null && <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(member.latest_payment_amount)}</p>}</td>
                    <td data-label="Registered" className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{formatDate(member.created_at)}</td>
                    <td data-label="Profile" className="px-4 py-4"><Button size="sm" onClick={() => openMember(member)}>View details</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Showing {startItem}–{endItem} of {results.total} customers</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</Button>
              {visiblePages.map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === page ? 'page' : undefined} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition ${pageNumber === page ? 'bg-brand-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{pageNumber}</button>)}
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      ) : <EmptyState title="No customers found" description="Try changing or clearing the selected filters." />}

      <MemberProfileDrawer member={selectedMember} overview={overview} loading={overviewLoading} error={overviewError} onClose={() => { setSelectedMember(null); setOverview(null); }} />
    </div>
  );
}
