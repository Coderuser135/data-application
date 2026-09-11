import { useEffect, useState } from 'react';
import { Search, Users, UserCheck, UserX, CreditCard, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { admissionService } from '@/services/admissionService';
import { userService } from '@/services/userService';
import { formatDate } from '@/utils/formatters';

function StatPill({ icon: Icon, label, value, tone }) {
  const tones = { success: 'text-emerald-500', warning: 'text-amber-500', danger: 'text-red-500', info: 'text-blue-500', neutral: 'text-surface-400' };
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-800">
      <Icon size={16} className={tones[tone]} />
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="font-display text-lg font-bold text-ink-950 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({ rows: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await admissionService.searchUsers(query, page, 20);
        setResults(res);
      } catch { setResults({ rows: [], total: 0, page: 1, pages: 1 }); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page]);

  const rows = results.rows || [];
  const filtered = filter === 'all' ? rows : filter === 'admitted' ? rows.filter((u) => u.is_admitted) : filter === 'not_admitted' ? rows.filter((u) => !u.is_admitted) : rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Members & Users</h1>
        <p className="mt-1 text-sm text-surface-500">Manage all registered users and gym members</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill icon={Users} label="Total Users" value={results.total} tone="info" />
        <StatPill icon={UserCheck} label="Admitted" value={rows.filter((u) => u.is_admitted).length} tone="success" />
        <StatPill icon={UserX} label="Not Admitted" value={rows.filter((u) => !u.is_admitted).length} tone="warning" />
        <StatPill icon={CreditCard} label="On This Page" value={rows.length} tone="neutral" />
      </div>

      <Card>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone, or member ID..."
            className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white"
          />
        </div>
        <div className="mt-3 flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'admitted', label: 'Admitted' },
            { key: 'not_admitted', label: 'Not Admitted' },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${filter === f.key ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>{f.label}</button>
          ))}
        </div>
      </Card>

      {filtered.length > 0 ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Contact</th>
                  <th className="px-5 py-4 font-medium">Member ID</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id || u.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">{u.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                        <span className="font-medium text-ink-900 dark:text-white">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-surface-600 dark:text-surface-300">{u.email}</p>
                      <p className="text-xs text-surface-500">{u.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-brand-600">{u.member_id || '—'}</td>
                    <td className="px-5 py-4">{u.role === 'admin' ? <Badge tone="info">Admin</Badge> : <Badge tone="neutral">User</Badge>}</td>
                    <td className="px-5 py-4">{u.is_admitted ? <Badge tone="success">Admitted</Badge> : <Badge tone="warning">Not Admitted</Badge>}</td>
                    <td className="px-5 py-4 text-surface-500">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.pages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-200 px-5 py-3 dark:border-surface-800">
              <span className="text-xs text-surface-500">Page {results.page} of {results.pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= results.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : !loading ? <EmptyState title="No users found" description="Try a different search or filter." /> : null}
    </div>
  );
}
