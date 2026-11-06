import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, CalendarDays, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import AdminLoadingSkeleton from '@/components/admin/AdminLoadingSkeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import { fetchAdmittedMembers, fetchMeasurementsByUser, createMeasurement, updateMeasurement, deleteMeasurement } from '@/redux/slices/measurementSlice';
import { formatDate } from '@/utils/formatters';

const EMPTY_FORM = { age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' };
const FIELDS = [
  ['age', 'Age', 'years'], ['height', 'Height', 'cm'], ['weight', 'Weight', 'kg'],
  ['chest', 'Chest', 'in'], ['stomach', 'Waist / stomach', 'in'], ['biceps', 'Biceps', 'in'],
  ['back', 'Back', 'in'], ['legs', 'Legs', 'in'], ['body_fat', 'Body fat', '%'], ['muscle_mass', 'Muscle mass', 'kg'],
];

function localDateValue(value = new Date()) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function monthLabel(value) {
  return new Date(value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function AdminMemberMeasurements() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const { members, selectedUserMeasurements, loading } = useSelector((state) => state.measurements);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    dispatch(fetchAdmittedMembers()).finally(() => { if (active) setMembersLoading(false); });
    return () => { active = false; };
  }, [dispatch]);
  useEffect(() => { if (userId) dispatch(fetchMeasurementsByUser(userId)); }, [dispatch, userId]);

  const member = members.find((item) => String(item.user_id) === String(userId));
  const records = useMemo(() => [...selectedUserMeasurements].sort((a, b) => new Date(b.measurement_date) - new Date(a.measurement_date)), [selectedUserMeasurements]);
  const groups = useMemo(() => {
    const result = new Map();
    records.forEach((record) => {
      const key = new Date(record.measurement_date).toLocaleDateString('en-CA');
      const monthKey = key.slice(0, 7);
      if (!result.has(monthKey)) result.set(monthKey, []);
      result.get(monthKey).push(record);
    });
    return [...result.entries()].map(([key, items]) => ({
      key,
      label: monthLabel(`${key}-01T12:00:00`),
      items,
    }));
  }, [records]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, measurement_date: localDateValue() });
    setError(''); setNotice(''); setShowForm(true);
  }
  function openEdit(record) {
    setEditing(record);
    setForm({ ...EMPTY_FORM, ...Object.fromEntries(Object.entries(EMPTY_FORM).map(([key]) => [key, record[key] ?? ''])), measurement_date: localDateValue(record.measurement_date) });
    setError(''); setNotice(''); setShowForm(true);
  }
  function changeField(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function saveMeasurement() {
    if (!form.measurement_date) { setError('Measurement date is required.'); return; }
    if (!FIELDS.some(([key]) => String(form[key]).trim() !== '')) { setError('Enter at least one measurement value.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { user_id: userId, ...form, measurement_date: new Date(`${form.measurement_date}T12:00:00`).toISOString() };
      if (editing) await dispatch(updateMeasurement({ id: editing._id || editing.id, data: payload })).unwrap();
      else await dispatch(createMeasurement(payload)).unwrap();
      await dispatch(fetchMeasurementsByUser(userId)).unwrap();
      setShowForm(false); setEditing(null); setNotice(editing ? 'Measurement updated successfully.' : 'Measurement saved successfully.');
    } catch (requestError) {
      setError(typeof requestError === 'string' ? requestError : 'Could not save this measurement. Please try again.');
    } finally { setSaving(false); }
  }

  async function removeMeasurement(record) {
    if (!window.confirm('Delete this measurement record permanently?')) return;
    setError(''); setNotice('');
    try {
      await dispatch(deleteMeasurement(record._id || record.id)).unwrap();
      await dispatch(fetchMeasurementsByUser(userId)).unwrap();
      setNotice('Measurement deleted successfully.');
    } catch (requestError) {
      setError(typeof requestError === 'string' ? requestError : 'Could not delete this measurement.');
    }
  }

  if (membersLoading || (loading && !selectedUserMeasurements.length)) return <AdminLoadingSkeleton variant="details" />;
  if (!member) return (
    <div className="space-y-4">
      <Link to="/admin/body-measurements" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"><ArrowLeft size={16}/> Back to members</Link>
      <EmptyState title="Member profile not found" description="This member may no longer have an admission record." />
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <Link to="/admin/body-measurements" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"><ArrowLeft size={16}/> Back to members</Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Body Measurement Profile</h1><p className="mt-1 text-sm text-surface-500">Complete measurement history for this member</p></div>
        <Button onClick={openAdd} disabled={member.admission_status !== 'active'} title={member.admission_status !== 'active' ? 'An active admission is required to add measurements' : undefined}><Plus size={16}/> Add Measurement</Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-xl font-bold text-brand-600 dark:text-brand-400">{(member.full_name || 'M').charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{member.full_name || 'Unnamed member'}</h2><p className="break-all text-sm text-surface-500">{member.email || '—'}</p><p className="mt-1 text-xs text-surface-500">{member.phone || 'No phone'} · {member.member_id || 'No member ID'}</p></div>
          <Badge color={member.admission_status === 'active' ? 'success' : 'secondary'}>{member.admission_status || 'Admitted'}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70"><p className="text-xs text-surface-500">Admission date</p><p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{formatDate(member.admission_date)}</p></div><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70"><p className="text-xs text-surface-500">Total records</p><p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{records.length}</p></div><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70"><p className="text-xs text-surface-500">Months tracked</p><p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{groups.length}</p></div></div>
      </Card>

      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</div>}
      {error && !showForm && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">Measurement History</h2><p className="mt-1 text-xs text-surface-500">Records are grouped by the month of their measurement date.</p></div><span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-300"><CalendarDays size={13} className="mr-1 inline"/> {records.length} records</span></div>

      {loading ? <AdminLoadingSkeleton variant="table" rows={4}/> : groups.length ? groups.map((group) => (
        <Card key={group.key} padding={false}>
          <div className="flex items-center justify-between border-b border-surface-200 px-4 py-4 dark:border-surface-800 sm:px-5"><div><h3 className="font-bold text-ink-950 dark:text-white">{group.label}</h3><p className="mt-1 text-xs text-surface-500">{group.items.length} measurement {group.items.length === 1 ? 'record' : 'records'}</p></div><Badge>{group.key}</Badge></div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {group.items.map((record) => (
              <div key={record._id || record.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink-950 dark:text-white">{formatDate(record.measurement_date)}</p><p className="mt-1 text-xs text-surface-500">Recorded {formatDate(record.createdAt)}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(record)}><Pencil size={13}/> Edit</Button><Button size="sm" variant="danger" onClick={() => removeMeasurement(record)}><Trash2 size={13}/> Delete</Button></div></div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{FIELDS.map(([key, label, unit]) => <div key={key} className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"><p className="text-[11px] text-surface-500">{label}</p><p className="mt-1 text-sm font-bold text-ink-900 dark:text-white">{record[key] !== undefined && record[key] !== null && record[key] !== 0 ? record[key] : '—'} <span className="text-[10px] font-medium text-surface-500">{unit}</span></p></div>)}</div>
                {record.notes && <p className="mt-3 rounded-lg bg-surface-50 p-3 text-sm text-surface-600 dark:bg-surface-800/60 dark:text-surface-300">{record.notes}</p>}
              </div>
            ))}
          </div>
        </Card>
      )) : <EmptyState title="No measurements recorded yet" description="Add the first measurement for this member. You can choose the actual date when the measurement was taken." />}

      {showForm && createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section role="dialog" aria-modal="true" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-800 dark:bg-surface-900">
            <header className="sticky top-0 flex items-center justify-between border-b border-surface-200 bg-white px-5 py-4 dark:border-surface-800 dark:bg-surface-900"><div><h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{editing ? 'Update Measurement' : 'Add New Measurement'}</h2><p className="mt-1 text-xs text-surface-500">{member.full_name}</p></div><button onClick={() => setShowForm(false)} aria-label="Close form" className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18}/></button></header>
            <div className="space-y-4 p-5">
              {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-900 dark:bg-brand-950/20"><label className="mb-2 block text-sm font-semibold text-ink-900 dark:text-white">Measurement date <span className="text-red-500">*</span></label><input type="date" value={form.measurement_date} onChange={(event) => changeField('measurement_date', event.target.value)} className="min-h-11 w-full rounded-xl border border-surface-300 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white"/><p className="mt-1 text-xs text-surface-500">Choose the date when the member's measurements were actually taken.</p></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{FIELDS.map(([key, label, unit]) => <Input key={key} label={`${label} (${unit})`} type="number" min="0" step="any" value={form[key]} onChange={(event) => changeField(key, event.target.value)} placeholder={unit}/>)}</div>
              <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">Notes<textarea rows={3} value={form.notes} onChange={(event) => changeField('notes', event.target.value)} maxLength={2000} placeholder="Optional notes about this measurement" className="mt-1.5 w-full rounded-xl border border-surface-300 bg-white p-3 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white"/></label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-surface-200 px-5 py-4 dark:border-surface-800"><Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={saveMeasurement} loading={saving}>{editing ? 'Save Changes' : 'Save Measurement'}</Button></footer>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
