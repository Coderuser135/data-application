import { useEffect, useMemo, useState } from 'react';
import AdminAvatar from '@/components/admin/AdminAvatar';
import { Search, Ruler, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchAdmittedMembers } from '@/redux/slices/measurementSlice';
import { formatDate } from '@/utils/formatters';

export default function AdminBodyMeasurements() {
  const dispatch = useDispatch();
  const { members, loading } = useSelector((state) => state.measurements);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => { dispatch(fetchAdmittedMembers()); }, [dispatch]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) =>
      [member.full_name, member.email, member.phone, member.member_id]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [members, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * limit, currentPage * limit);
  const firstPage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index);
  const start = filtered.length ? (currentPage - 1) * limit + 1 : 0;
  const end = Math.min(currentPage * limit, filtered.length);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Body Measurements</h1>
        <p className="mt-1 text-sm text-surface-500">Open a member profile to view and manage their complete measurement history.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-ink-950 dark:text-white">Admitted Members</h2>
            <p className="mt-1 text-xs text-surface-500">{members.length} member profiles</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search name, email, phone or member ID"
              className="min-h-11 w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white" />
          </div>
        </div>
      </Card>

      {loading && !members.length ? <AdminLoadingSkeleton variant="cards" rows={6} /> : visible.length ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((member) => (
              <Link key={member.user_id} to={`/admin/body-measurements/${member.user_id}`}
                className="group block rounded-2xl border border-surface-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-600">
                <div className="flex items-start gap-3">
                  <AdminAvatar name={member.full_name} src={member.avatar_url} className="h-12 w-12 rounded-xl text-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-ink-950 dark:text-white">{member.full_name || 'Unnamed member'}</p>
                      <Badge color={member.admission_status === 'active' ? 'success' : 'secondary'}>{member.admission_status || 'Admitted'}</Badge>
                    </div>
                    <p className="mt-1 break-all text-xs text-surface-500">{member.email || 'Email unavailable'}</p>
                    <p className="mt-1 text-xs text-surface-500">{member.phone || 'Phone unavailable'}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-surface-200 pt-3 text-xs dark:border-surface-800">
                  <div><p className="text-surface-500">Member ID</p><p className="mt-1 font-semibold text-ink-800 dark:text-surface-100">{member.member_id || '—'}</p></div>
                  <div><p className="text-surface-500">Admission date</p><p className="mt-1 font-semibold text-ink-800 dark:text-surface-100">{formatDate(member.admission_date)}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span>Open measurement profile</span><ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-surface-200 pt-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-surface-500">
              <span>Showing {start}–{end} of {filtered.length} members</span>
              <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
                className="min-h-9 rounded-lg border border-surface-300 bg-white px-2 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white">
                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={14}/> Prev</Button>
              {pages.map((number) => <button key={number} type="button" onClick={() => setPage(number)} aria-current={number === currentPage ? 'page' : undefined}
                className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold ${number === currentPage ? 'bg-brand-600 text-white' : 'border border-surface-300 bg-white text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300'}`}>{number}</button>)}
              <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={14}/></Button>
            </div>
          </div>
        </>
      ) : <EmptyState title={search ? 'No matching members' : 'No admitted members yet'} description={search ? 'Try another search term.' : 'Members appear here after their gym admission is created.'} />}
    </div>
  );
}
