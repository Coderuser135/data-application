import { useEffect, useState } from 'react';
import { Search, X, Plus, Pencil, Trash2, Ruler, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import { fetchAllMeasurements, fetchAdmittedMembers, createMeasurement, updateMeasurement, deleteMeasurement, fetchMeasurementsByUser } from '@/redux/slices/measurementSlice';
import { admissionService } from '@/services/admissionService';
import { formatDate } from '@/utils/formatters';

const FIELDS = ['weight', 'height', 'chest', 'stomach', 'biceps', 'back', 'legs', 'body_fat', 'muscle_mass'];

export default function AdminBodyMeasurements() {
  const dispatch = useDispatch();
  const { adminItems, members, selectedUserMeasurements, loading } = useSelector((state) => state.measurements);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' });

  useEffect(() => { dispatch(fetchAllMeasurements()); dispatch(fetchAdmittedMembers()); }, [dispatch]);

  useEffect(() => {
    if (selectedMember) dispatch(fetchMeasurementsByUser(selectedMember.user_id || selectedMember._id));
  }, [dispatch, selectedMember]);

  async function handleSearch(e) {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length >= 2) {
      try { const res = await admissionService.searchUsers(q, 1, 10); setSearchResults((res.rows || []).filter((user) => user.is_admitted && user.admission_status === 'active')); } catch { setSearchResults([]); }
    } else { setSearchResults([]); }
  }

  function selectMember(member) {
    setPage(1);
    setSelectedMember(member);
    setSearchQuery('');
    setSearchResults([]);
  }

  function updateField(key, value) { setFormData((prev) => ({ ...prev, [key]: value })); }

  function openCreateForm() {
    setEditingMeasurement(null);
    setFormData({ age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' });
    setError('');
    setShowForm(true);
  }

  function openEditForm(m) {
    setEditingMeasurement(m);
    setFormData({ age: m.age ?? '', height: m.height ?? '', weight: m.weight ?? '', stomach: m.stomach ?? '', chest: m.chest ?? '', biceps: m.biceps ?? '', back: m.back ?? '', legs: m.legs ?? '', body_fat: m.body_fat ?? '', muscle_mass: m.muscle_mass ?? '', notes: m.notes || '', measurement_date: m.measurement_date ? new Date(m.measurement_date).toISOString().slice(0, 10) : '' });
    setError('');
    setShowForm(true);
  }

  async function handleDelete(m) {
    if (!window.confirm('Delete this body measurement record? This action cannot be undone.')) return;
    try {
      await dispatch(deleteMeasurement(m._id || m.id)).unwrap();
      const userId = selectedMember.user_id || selectedMember._id;
      dispatch(fetchMeasurementsByUser(userId));
      dispatch(fetchAllMeasurements());
    } catch (err) { setError(typeof err === 'string' ? err : 'Failed to delete measurement'); }
  }

  async function handleSubmit() {
    if (!selectedMember) { setError('Select a member first'); return; }
    setSubmitting(true);
    setError('');
    try {
      const userId = selectedMember.user_id || selectedMember._id;
      const payload = { user_id: userId, ...formData, measurement_date: formData.measurement_date || undefined };
      if (editingMeasurement) await dispatch(updateMeasurement({ id: editingMeasurement._id || editingMeasurement.id, data: payload })).unwrap();
      else await dispatch(createMeasurement(payload)).unwrap();
      setShowForm(false);
      setFormData({ age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' });
      dispatch(fetchMeasurementsByUser(userId));
      dispatch(fetchAllMeasurements());
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save measurement');
    } finally {
      setSubmitting(false);
    }
  }

  const measurements = selectedMember ? selectedUserMeasurements : adminItems;
  const latest = measurements[0];
  const previous = measurements[1];
  const totalRecords = measurements.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / limit));
  const currentPage = Math.min(page, pageCount);
  const startItem = totalRecords ? (currentPage - 1) * limit + 1 : 0;
  const endItem = Math.min(currentPage * limit, totalRecords);
  const visibleMeasurements = measurements.slice((currentPage - 1) * limit, currentPage * limit);
  const firstPageNumber = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const visiblePages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPageNumber + index);

  function delta(field) {
    if (!latest || !previous) return null;
    const diff = Number(latest[field]) - Number(previous[field]);
    return diff === 0 ? null : diff;
  }

  if (loading && measurements.length === 0) return <AdminLoadingSkeleton variant="table" rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Body Measurements</h1>
          <p className="mt-1 text-sm text-surface-500">Record and track member body progress</p>
        </div>
        {selectedMember && <Button onClick={openCreateForm}><Plus size={16} /> Add Measurement</Button>}
      </div>

      <Card>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search member by name, email, or phone..."
            className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {searchResults.map((u) => (
              <button key={u._id || u.id} onClick={() => selectMember(u)} className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-surface-50 dark:hover:bg-surface-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">{u.full_name?.charAt(0)?.toUpperCase()}</span>
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{u.full_name}</p>
                  <p className="text-xs text-surface-500">{u.email} {u.is_admitted && '· Admitted'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedMember && (
        <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">{selectedMember.full_name?.charAt(0)?.toUpperCase()}</span>
          <div className="flex-1">
            <p className="font-semibold text-ink-900 dark:text-white">{selectedMember.full_name}</p>
            <p className="text-xs text-surface-500">{selectedMember.email}</p>
          </div>
          <button onClick={() => setSelectedMember(null)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={16} /></button>
        </div>
      )}

      {selectedMember && latest && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FIELDS.slice(0, 5).map((field) => {
            const d = delta(field);
            return (
              <Card key={field}>
                <p className="text-xs capitalize text-surface-500">{field.replace('_', ' ')}</p>
                <p className="mt-2 font-display text-xl font-bold text-ink-950 dark:text-white">{latest[field] || '—'}</p>
                {d !== null && (
                  <p className={`mt-1 flex items-center gap-1 text-xs ${d > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {d > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {d > 0 ? '+' : ''}{d.toFixed(1)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card padding={false}>
        <div className="border-b border-surface-200 px-5 py-4 dark:border-surface-800">
          <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">
            {selectedMember ? `${selectedMember.full_name}'s History` : 'All Measurements'}
          </h3>
        </div>
        {measurements.length > 0 ? (
          <div className="admin-table-scroll w-full min-w-0" style={{ display: 'block', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
            <table className="admin-data-table text-sm" style={{ width: '980px', minWidth: '980px', maxWidth: 'none', tableLayout: 'auto' }}>
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Weight</th>
                  <th className="px-5 py-3 font-medium">Chest</th>
                  <th className="px-5 py-3 font-medium">Waist</th>
                  <th className="px-5 py-3 font-medium">Biceps</th>
                  <th className="px-5 py-3 font-medium">Body Fat</th>{selectedMember && <th className="px-5 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visibleMeasurements.map((m) => (
                  <tr key={m.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td data-label="Date" className="px-5 py-3 font-medium">{formatDate(m.measurement_date)}</td>
                    <td data-label="Member" className="px-5 py-3 text-surface-600 dark:text-surface-300">{m.user_id?.full_name || '—'}</td>
                    <td data-label="Weight" className="px-5 py-3">{m.weight || '—'}</td>
                    <td data-label="Chest" className="px-5 py-3">{m.chest || '—'}</td>
                    <td data-label="Waist" className="px-5 py-3">{m.stomach || '—'}</td>
                    <td data-label="Biceps" className="px-5 py-3">{m.biceps || '—'}</td>
                    <td data-label="Body Fat" className="px-5 py-3">{m.body_fat || '—'}</td>{selectedMember && <td data-label="Actions" className="px-5 py-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openEditForm(m)}><Pencil size={13} /> Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(m)}><Trash2 size={13} /> Delete</Button></div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-surface-200 px-4 py-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-surface-500">Showing {startItem}–{endItem} of {totalRecords} measurements</span>
              <label className="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-300">
                Rows per page
                <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="min-h-9 rounded-lg border border-surface-300 bg-white px-2 text-sm text-ink-900 dark:border-surface-700 dark:bg-surface-950 dark:text-white">
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14}/> Prev</Button>
              {visiblePages.map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === currentPage ? 'page' : undefined} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition ${pageNumber === currentPage ? 'bg-brand-600 text-white shadow-sm' : 'border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:bg-surface-800'}`}>{pageNumber}</button>)}
              <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next <ChevronRight size={14}/></Button>
            </div>
          </div>
        ) : <div className="p-5"><EmptyState title="No measurements yet" description={selectedMember ? "Add this member's first measurement." : 'Select a member to view their history.'} /></div>}
      </Card>

      {showForm && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-800 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-800">
              <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{editingMeasurement ? 'Edit Measurement' : 'Add Measurement'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-6">
              {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Age" type="number" value={formData.age} onChange={(e) => updateField('age', e.target.value)} placeholder="Years" />
                <Input label="Height (cm)" type="number" value={formData.height} onChange={(e) => updateField('height', e.target.value)} placeholder="cm" />
                <Input label="Weight (kg)" type="number" value={formData.weight} onChange={(e) => updateField('weight', e.target.value)} placeholder="kg" />
                <Input label="Chest (in)" type="number" value={formData.chest} onChange={(e) => updateField('chest', e.target.value)} placeholder="inches" />
                <Input label="Stomach (in)" type="number" value={formData.stomach} onChange={(e) => updateField('stomach', e.target.value)} placeholder="inches" />
                <Input label="Biceps (in)" type="number" value={formData.biceps} onChange={(e) => updateField('biceps', e.target.value)} placeholder="inches" />
                <Input label="Back (in)" type="number" value={formData.back} onChange={(e) => updateField('back', e.target.value)} placeholder="inches" />
                <Input label="Legs (in)" type="number" value={formData.legs} onChange={(e) => updateField('legs', e.target.value)} placeholder="inches" />
                <Input label="Body Fat %" type="number" value={formData.body_fat} onChange={(e) => updateField('body_fat', e.target.value)} placeholder="%" />
                <Input label="Muscle Mass (kg)" type="number" value={formData.muscle_mass} onChange={(e) => updateField('muscle_mass', e.target.value)} placeholder="kg" />
              </div>
              <Input label="Measurement Date" type="date" value={formData.measurement_date} onChange={(e) => updateField('measurement_date', e.target.value)} />
              <Input label="Notes" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Optional notes" />
            </div>
            <div className="flex justify-end gap-2 border-t border-surface-200 px-6 py-4 dark:border-surface-800">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit} loading={submitting}>{editingMeasurement ? 'Update Measurement' : 'Save Measurement'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
