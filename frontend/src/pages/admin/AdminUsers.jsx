import { useEffect, useState } from 'react';
import { Search, Users, UserCheck, UserX, CreditCard } from 'lucide-react';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { admissionService } from '@/services/admissionService';
import { formatDate } from '@/utils/formatters';

function StatPill({ icon: Icon, label, value, tone }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
    info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600',
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/10 sm:p-5">
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

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState({ rows: [], total: 0, page: 1, pages: 1, stats: { totalUsers: 0, admitted: 0, notAdmitted: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await admissionService.searchUsers(query, page, limit, { admissionFilter: filter });
        if (active) setResults(res);
      } catch {
        if (active) setResults({ rows: [], total: 0, page: 1, pages: 1 });
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, page, limit, filter]);

  const rows = results.rows || [];
  const filtered = rows;

  const pageCount = Math.max(1, Number(results.pages) || 1);
  const firstPageNumber = Math.max(1, Math.min(page - 2, pageCount - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPageNumber + index,
  );
  const startItem = results.total === 0 ? 0 : ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, results.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Members & Users</h1>
        <p className="mt-1 text-sm text-surface-500">Manage all registered users and gym members</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatPill icon={Users} label="Total Users" value={results.stats?.totalUsers ?? results.total} tone="info" />
        <StatPill icon={UserCheck} label="Total Admitted" value={results.stats?.admitted ?? 0} tone="success" />
        <StatPill icon={UserX} label="Not Admitted" value={results.stats?.notAdmitted ?? 0} tone="warning" />
        <StatPill icon={CreditCard} label="Showing on Page" value={rows.length} tone="neutral" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search by name, email, phone, or member ID..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:hover:border-slate-500"
            />
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Rows per page
            <select
              value={limit}
              onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'admitted', label: 'Admitted' },
            { key: 'not_admitted', label: 'Not Admitted' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => { setFilter(item.key); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${filter === item.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <AdminLoadingSkeleton variant="table" rows={limit === 5 ? 5 : 6} />
      ) : filtered.length > 0 ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="admin-mobile-cards w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Member ID</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id || user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td data-label="User" className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-extrabold text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20">
                          {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.full_name || '—'}</span>
                      </div>
                    </td>
                    <td data-label="Contact" className="max-w-xs px-5 py-4">
                      <p className="break-all font-medium text-slate-800 dark:text-slate-200">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{user.phone || '—'}</p>
                    </td>
                    <td data-label="Member ID" className="px-5 py-4 font-mono text-xs font-bold text-brand-700 dark:text-brand-300">{user.member_id || '—'}</td>
                    <td data-label="Role" className="px-5 py-4">{user.role === 'admin' ? <Badge tone="info">Admin</Badge> : <Badge tone="neutral">User</Badge>}</td>
                    <td data-label="Status" className="px-5 py-4">{user.is_admitted ? <Badge tone="success">Admitted</Badge> : <Badge tone="warning">Not Admitted</Badge>}</td>
                    <td data-label="Joined" className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(user.created_at || user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Showing {startItem}–{endItem} of {results.total} users
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</Button>
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={pageNumber === page ? 'page' : undefined}
                    onClick={() => setPage(pageNumber)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition ${pageNumber === page
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState title="No users found" description={filter === 'all' ? 'Try a different search term.' : 'No users match this filter on the current page.'} />
      )}
    </div>
  );
}
