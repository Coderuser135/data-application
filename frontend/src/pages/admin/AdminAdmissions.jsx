import { useEffect, useState } from 'react';
import { Search, UserPlus, X, Check, ChevronRight, ChevronLeft, User, Phone, Mail, CreditCard, Ruler, IndianRupee } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import { searchUsers, createAdmission } from '@/redux/slices/admissionSlice';
import { fetchMembershipPlans } from '@/redux/slices/membershipPlanSlice';
import { formatCurrency } from '@/utils/formatters';

const STEPS = ['User', 'Personal Details', 'Measurement', 'Advance Payment', 'Confirm'];

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${i < current ? 'bg-brand-600 text-white' : i === current ? 'bg-brand-600 text-white ring-4 ring-brand-600/20' : 'bg-surface-200 text-surface-500 dark:bg-surface-800'}`}>
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded ${i < current ? 'bg-brand-600' : 'bg-surface-200 dark:bg-surface-800'}`} />}
        </div>
      ))}
    </div>
  );
}

function Avatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">{initial}</span>;
}

export default function AdminAdmissions() {
  const dispatch = useDispatch();
  const { searchResults, loading } = useSelector((state) => state.admissions);
  const plans = useSelector((state) => state.membershipPlans.items);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    full_name: '',
    phone: '',
    address: '',
    measurement: { age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' },
    payment_method: 'cash',
    payment_amount: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => { dispatch(searchUsers({ q: query, page })); }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, query, page]);

  useEffect(() => { dispatch(fetchMembershipPlans()); }, [dispatch]);

  function openAdmission(user) {
    setSelectedUser(user);
    setFormData((previous) => ({
      ...previous,
      full_name: user.full_name || '',
      phone: user.phone || '',
      address: user.address || '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: '',
      payment_amount: '',
      payment_method: 'cash',
      measurement: { age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' },
    }));
    setStep(0);
    setError('');
    setShowModal(true);
  }

  function updateField(key, value) { setFormData((prev) => ({ ...prev, [key]: value })); }
  function updateMeasurement(key, value) { setFormData((prev) => ({ ...prev, measurement: { ...prev.measurement, [key]: value } })); }

  const activePlans = (plans || []).filter((plan) => plan.is_active !== false);
  const lowestPricedPlan = activePlans.reduce((lowest, plan) => (
    !lowest || Number(plan.price) < Number(lowest.price) ? plan : lowest
  ), null);
  const advanceAmount = Number(formData.payment_amount) || 0;
  const advanceError = advanceAmount > 0 && !lowestPricedPlan
    ? 'No active membership plan is available. Activate a plan before receiving an advance.'
    : advanceAmount > Number(lowestPricedPlan?.price ?? 0)
      ? `Advance amount cannot exceed the lowest active membership plan price (${lowestPricedPlan.name}: ${formatCurrency(Number(lowestPricedPlan.price))}).`
      : '';

  function nextStep() {
    if (step === 3 && advanceError) {
      setError(advanceError);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prevStep() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      if (advanceError) {
        setError(advanceError);
        setSubmitting(false);
        return;
      }
      const payload = {
        user_id: selectedUser._id || selectedUser.id,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        notes: formData.notes,
        personal_details: {
          full_name: formData.full_name || selectedUser.full_name,
          phone: formData.phone || selectedUser.phone || '',
          address: formData.address || selectedUser.address || '',
        },
        measurement: Object.values(formData.measurement).some((value) => String(value || '').trim())
          ? formData.measurement
          : undefined,
        payment_method: formData.payment_method,
        payment_amount: Number(formData.payment_amount) || 0,
      };
      await dispatch(createAdmission(payload)).unwrap();
      setShowModal(false);
      setFormData({ emergency_contact_name: '', emergency_contact_phone: '', notes: '', full_name: '', phone: '', address: '', measurement: { age: '', height: '', weight: '', stomach: '', chest: '', biceps: '', back: '', legs: '', body_fat: '', muscle_mass: '', notes: '', measurement_date: '' }, payment_method: 'cash', payment_amount: '' });
      dispatch(searchUsers({ q: query, page }));
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create admission');
    } finally {
      setSubmitting(false);
    }
  }

  const rows = searchResults.rows || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Gym Admissions</h1>
        <p className="mt-1 text-sm text-surface-500">Search users and manage gym admissions</p>
      </div>

      <Card>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white"
          />
        </div>
      </Card>

      {rows.length > 0 ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Contact</th>
                  <th className="px-5 py-4 font-medium">Member ID</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u._id || u.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} />
                        <div>
                          <p className="font-medium text-ink-900 dark:text-white">{u.full_name || '—'}</p>
                          {u.role === 'admin' && <Badge tone="info">Admin</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-surface-600 dark:text-surface-300">{u.email}</p>
                      <p className="text-xs text-surface-500">{u.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-brand-600">{u.member_id || '—'}</td>
                    <td className="px-5 py-4">
                      {u.is_admitted ? <Badge tone={u.admission_status === 'active' ? 'success' : 'neutral'}>{u.admission_status}</Badge> : <Badge tone="warning">Not Admitted</Badge>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.is_admitted ? (
                        <Button variant="ghost" size="sm">View</Button>
                      ) : (
                        <Button size="sm" onClick={() => openAdmission(u)}><UserPlus size={14} /> Admit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(searchResults.pages || 1) > 1 && (
            <div className="flex items-center justify-between border-t border-surface-200 px-5 py-3 dark:border-surface-800">
              <span className="text-xs text-surface-500">Page {searchResults.page} of {searchResults.pages} ({searchResults.total} users)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= searchResults.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : !loading ? <EmptyState title="No users found" description="Try a different search term." /> : null}

      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-800 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-surface-200 bg-white px-6 py-4 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">New Gym Admission</h2>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18} /></button>
              </div>
              <div className="mt-4"><Stepper current={step} /></div>
              <p className="mt-3 text-center text-xs font-medium text-surface-500">{STEPS[step]} — Step {step + 1} of {STEPS.length}</p>
            </div>

            <div className="space-y-5 p-6">
              {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

              {step === 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
                    <Avatar name={selectedUser.full_name} />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{selectedUser.full_name}</p>
                      <p className="text-sm text-surface-500">{selectedUser.email}</p>
                      <p className="text-sm text-surface-500">{selectedUser.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-500">Confirm this is the correct user before proceeding with admission.</p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <Input label="Full Name" value={formData.full_name || selectedUser.full_name || ''} onChange={(e) => updateField('full_name', e.target.value)} placeholder="Member full name" />
                  <Input label="Phone" value={formData.phone || selectedUser.phone || ''} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone number" />
                  <Input label="Address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Full address" />
                  <Input label="Emergency Contact Name" value={formData.emergency_contact_name} onChange={(e) => updateField('emergency_contact_name', e.target.value)} placeholder="Contact name" />
                  <Input label="Emergency Contact Phone" value={formData.emergency_contact_phone} onChange={(e) => updateField('emergency_contact_phone', e.target.value)} placeholder="Phone number" />
                  <Input label="Notes (optional)" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Any admission notes" />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-surface-500">Initial body measurement (optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Age" type="number" value={formData.measurement.age} onChange={(e) => updateMeasurement('age', e.target.value)} placeholder="Years" />
                    <Input label="Height (cm)" type="number" value={formData.measurement.height} onChange={(e) => updateMeasurement('height', e.target.value)} placeholder="cm" />
                    <Input label="Weight (kg)" type="number" value={formData.measurement.weight} onChange={(e) => updateMeasurement('weight', e.target.value)} placeholder="kg" />
                    <Input label="Chest (in)" type="number" value={formData.measurement.chest} onChange={(e) => updateMeasurement('chest', e.target.value)} placeholder="inches" />
                    <Input label="Stomach (in)" type="number" value={formData.measurement.stomach} onChange={(e) => updateMeasurement('stomach', e.target.value)} placeholder="inches" />
                    <Input label="Biceps (in)" type="number" value={formData.measurement.biceps} onChange={(e) => updateMeasurement('biceps', e.target.value)} placeholder="inches" />
                    <Input label="Back (in)" type="number" value={formData.measurement.back} onChange={(e) => updateMeasurement('back', e.target.value)} placeholder="inches" />
                    <Input label="Legs (in)" type="number" value={formData.measurement.legs} onChange={(e) => updateMeasurement('legs', e.target.value)} placeholder="inches" />
                    <Input label="Body Fat %" type="number" value={formData.measurement.body_fat} onChange={(e) => updateMeasurement('body_fat', e.target.value)} placeholder="%" />
                    <Input label="Muscle Mass (kg)" type="number" value={formData.measurement.muscle_mass} onChange={(e) => updateMeasurement('muscle_mass', e.target.value)} placeholder="kg" />
                  </div>
                  <Input label="Measurement Date" type="date" value={formData.measurement.measurement_date} onChange={(e) => updateMeasurement('measurement_date', e.target.value)} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
                    <p className="font-semibold text-ink-900 dark:text-white">Membership advance payment (optional)</p>
                    <p className="mt-1 text-sm text-surface-500">This is not a membership purchase. Any amount received now will be credited and adjusted against the plan the member chooses later.</p>
                  </div>
                  <Input label="Advance Amount (₹)" type="number" min="0" value={formData.payment_amount} onChange={(e) => { updateField('payment_amount', e.target.value); setError(''); }} placeholder="Enter 0 if no advance is received" />
                  {lowestPricedPlan && <p className="text-xs text-surface-500">Maximum allowed advance: {formatCurrency(Number(lowestPricedPlan.price))} (lowest active plan: {lowestPricedPlan.name})</p>}
                  {advanceError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{advanceError}</p>}
                  {Number(formData.payment_amount) > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-surface-200">Received Via</label>
                      <div className="flex gap-2">
                        {['cash', 'online', 'other'].map((method) => (
                          <button key={method} type="button" onClick={() => updateField('payment_method', method)} className={`flex-1 rounded-xl border py-3 text-sm font-medium capitalize transition ${formData.payment_method === method ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>{method}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-surface-500">The member will select a membership plan from their own dashboard after admission. The advance will reduce the amount due for that plan.</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
                    <div className="flex justify-between border-b border-surface-200 py-2 text-sm dark:border-surface-700"><span className="text-surface-500">User</span><span className="font-medium">{formData.full_name || selectedUser.full_name}</span></div>
                    <div className="flex justify-between border-b border-surface-200 py-2 text-sm dark:border-surface-700"><span className="text-surface-500">Member ID</span><span className="font-mono font-semibold text-brand-600">Auto-generated</span></div>
                    <div className="flex justify-between border-b border-surface-200 py-2 text-sm dark:border-surface-700"><span className="text-surface-500">Membership Plan</span><span className="font-medium">Member will choose later</span></div>
                    <div className="flex justify-between border-b border-surface-200 py-2 text-sm dark:border-surface-700"><span className="text-surface-500">Advance Received</span><span className="font-medium">{formatCurrency(Number(formData.payment_amount) || 0)}</span></div>
                    <div className="flex justify-between py-2 text-sm"><span className="text-surface-500">Method</span><span className="font-medium capitalize">{Number(formData.payment_amount) > 0 ? formData.payment_method : 'None'}</span></div>
                  </div>
                  <p className="text-sm text-surface-500">Confirm admission. The member's gym admission will become active, but their membership plan will remain unpurchased until they select one.</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between border-t border-surface-200 bg-white px-6 py-4 dark:border-surface-800 dark:bg-surface-900">
              <Button variant="ghost" onClick={prevStep} disabled={step === 0}><ChevronLeft size={16} /> Back</Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={nextStep}>Next <ChevronRight size={16} /></Button>
              ) : (
                <Button onClick={handleSubmit} loading={submitting}><Check size={16} /> Confirm Admission</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
