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
import { formatDate } from '@/utils/formatters';

const FIELDS = ['weight', 'height', 'chest', 'stomach', 'biceps', 'back', 'legs', 'body_fat', 'muscle_mass'];

export default function AdminBodyMeasurements() {
  const dispatch = useDispatch();
  const { adminItems, members, selectedUserMeasurements, loading } = useSelector((state) => state.measurements);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [memberPage, setMemberPage] = useState(1);
  const [memberLimit, setMemberLimit] = useState(10);
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

  function handleSearch(e) {
    setSearchQuery(e.target.value);
    setMemberPage(1);
  }

  function selectMember(member) {
    setPage(1);
    setSelectedMember(member);
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

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [member.full_name, member.email, member.phone, member.member_id]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const memberPageCount = Math.max(1, Math.ceil(filteredMembers.length / memberLimit));
  const currentMemberPage = Math.min(memberPage, memberPageCount);
  const visibleMembers = filteredMembers.slice((currentMemberPage - 1) * memberLimit, currentMemberPage * memberLimit);
  const memberStartItem = filteredMembers.length ? (currentMemberPage - 1) * memberLimit + 1 : 0;
  const memberEndItem = Math.min(currentMemberPage * memberLimit, filteredMembers.length);
  const memberFirstPage = Math.max(1, Math.min(currentMemberPage - 2, memberPageCount - 4));
  const visibleMemberPages = Array.from({ length: Math.min(5, memberPageCount) }, (_, index) => memberFirstPage + index);

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
        {selectedMember && <Button onClick={openCreateForm} disabled={selectedMember.admission_status !== 'active'} title={selectedMember.admission_status !== 'active' ? 'Measurements can only be added for an active admission' : undefined}><Plus size={16} /> Add Measurement</Button>}
      </div>

      <Card padding={false}>
        <div className="flex flex-col gap-3 border-b border-surface-200 p-4 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-display text-base font-bold text-ink-950 dark:text-white">Admitted Members</h2>
            <p className="mt-1 text-xs text-surface-500">{members.length} users with a gym admission</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search name, email, phone or member ID..."
              className="min-h-11 w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white"
            />
          </div>
        </div>
        {visibleMembers.length ? (
          <>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
              {visibleMembers.map((member) => {
                const isSelected = selectedMember?.user_id === member.user_id;
                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => selectMember(member)}
                    className={`min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${isSelected ? 'border-brand-500 bg-brand-50/70 shadow-sm dark:bg-brand-500/10' : 'border-surface-200 bg-white hover:border-brand-300 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700'}`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-lg font-bold text-brand-600 dark:text-brand-400">
                        {(member.full_name || 'M').charAt(0).toUpperCase()}
                      </span>
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
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{isSelected ? 'Profile selected' : 'Open member profile'}</span>
                      <Ruler size={16} className="text-brand-500" />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-surface-200 px-4 py-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-surface-500">Showing {memberStartItem}–{memberEndItem} of {filteredMembers.length} members</span>
                <label className="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-300">Rows
                  <select value={memberLimit} onChange={(event) => { setMemberLimit(Number(event.target.value)); setMemberPage(1); }} className="min-h-9 rounded-lg border border-surface-300 bg-white px-2 text-sm text-ink-900 dark:border-surface-700 dark:bg-surface-950 dark:text-white">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="outline" size="sm" disabled={currentMemberPage <= 1} onClick={() => setMemberPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14}/> Prev</Button>
                {visibleMemberPages.map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === currentMemberPage ? 'page' : undefined} onClick={() => setMemberPage(pageNumber)} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition ${pageNumber === currentMemberPage ? 'bg-brand-600 text-white shadow-sm' : 'border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:bg-surface-800'}`}>{pageNumber}</button>)}
                <Button variant="outline" size="sm" disabled={currentMemberPage >= memberPageCount} onClick={() => setMemberPage((current) => Math.min(memberPageCount, current + 1))}>Next <ChevronRight size={14}/></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5"><EmptyState title={searchQuery ? 'No matching admitted members' : 'No admitted members yet'} description={searchQuery ? 'Try another name, email, phone or member ID.' : 'Members will appear here after their gym admission is completed.'} /></div>
        )}
      </Card>

      {selectedMember && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-xl font-bold text-brand-600 dark:text-brand-400">{(selectedMember.full_name || 'M').charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-ink-950 dark:text-white">{selectedMember.full_name || 'Unnamed member'}</p>
                <p className="break-all text-sm text-surface-500">{selectedMember.email || 'Email unavailable'}</p>
                <Badge color={selectedMember.admission_status === 'active' ? 'success' : 'secondary'}>{selectedMember.admission_status || 'Admitted'}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70"><p className="text-xs text-surface-500">Phone</p><p className="mt-1 break-words text-sm font-semibold text-ink-900 dark:text-white">{selectedMember.phone || '—'}</p></div>
              <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70"><p className="text-xs text-surface-500">Member ID</p><p className="mt-1 break-words text-sm font-semibold text-ink-900 dark:text-white">{selectedMember.member_id || '—'}</p></div>
              <div className="col-span-2 rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70"><p className="text-xs text-surface-500">Admission date</p><p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{formatDate(selectedMember.admission_date)}</p></div>
            </div>
            <button onClick={() => setSelectedMember(null)} aria-label="Close member profile" className="self-end rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 sm:self-start"><X size={16}/></button>
          </div>
        </Card>
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

      {selectedMember && (
        <Card padding={false}>
          <div className="flex flex-col gap-3 border-b border-surface-200 px-4 py-4 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">{selectedMember.full_name}'s Measurement History</h3>
              <p className="mt-1 text-xs text-surface-500">Only this member's recorded body measurements appear here</p>
            </div>
            <Button onClick={openCreateForm} disabled={selectedMember.admission_status !== 'active'}><Plus size={16}/> Add Measurement</Button>
          </div>
          {loading ? <div className="p-5"><AdminLoadingSkeleton variant="table" rows={4}/></div> : measurements.length ? (
            <div className="admin-table-scroll w-full min-w-0" style={{display:'block',width:'100%',maxWidth:'100%',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
              <table className="admin-data-table text-sm" style={{width:'980px',minWidth:'980px',maxWidth:'none',tableLayout:'auto'}}>
                <thead><tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Weight</th><th className="px-5 py-3 font-medium">Height</th><th className="px-5 py-3 font-medium">Chest</th><th className="px-5 py-3 font-medium">Waist</th><th className="px-5 py-3 font-medium">Biceps</th><th className="px-5 py-3 font-medium">Body Fat</th><th className="px-5 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>{visibleMeasurements.map((m) => (
                  <tr key={m._id || m.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-3 font-medium">{formatDate(m.measurement_date)}</td><td className="px-5 py-3">{m.weight || '—'}</td><td className="px-5 py-3">{m.height || '—'}</td><td className="px-5 py-3">{m.chest || '—'}</td><td className="px-5 py-3">{m.stomach || '—'}</td><td className="px-5 py-3">{m.biceps || '—'}</td><td className="px-5 py-3">{m.body_fat || '—'}</td>
                    <td className="px-5 py-3"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditForm(m)}><Pencil size={13}/> Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(m)}><Trash2 size={13}/> Delete</Button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="p-5"><EmptyState title="No measurements recorded" description="Add the first body measurement for this member." /></div>}
          {measurements.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-surface-200 px-4 py-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="text-xs font-medium text-surface-500">Showing {startItem}–{endItem} of {totalRecords} measurements</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1,current-1))}><ChevronLeft size={14}/> Prev</Button>
                {visiblePages.map((pageNumber)=><button key={pageNumber} type="button" onClick={()=>setPage(pageNumber)} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold ${pageNumber===currentPage?'bg-brand-600 text-white':'border border-surface-300 dark:border-surface-700'}`}>{pageNumber}</button>)}
                <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={()=>setPage((current)=>Math.min(pageCount,current+1))}>Next <ChevronRight size={14}/></Button>
              </div>
            </div>
          )}
        </Card>
      )}
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
