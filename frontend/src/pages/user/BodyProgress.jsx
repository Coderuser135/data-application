import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ruler, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { fetchMyMeasurements } from '@/redux/slices/measurementSlice';
import { formatDate } from '@/utils/formatters';

const FIELDS = [
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'chest', label: 'Chest', unit: 'in' },
  { key: 'stomach', label: 'Waist', unit: 'in' },
  { key: 'biceps', label: 'Biceps', unit: 'in' },
  { key: 'back', label: 'Back', unit: 'in' },
  { key: 'legs', label: 'Legs', unit: 'in' },
  { key: 'body_fat', label: 'Body Fat', unit: '%' },
  { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg' },
];

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  if (h <= 0) return null;
  return (weight / (h * h)).toFixed(1);
}

function TrendChart({ measurements }) {
  const sorted = [...measurements].reverse().slice(-8);
  if (sorted.length < 2) return null;

  const weights = sorted.map((m) => Number(m.weight) || 0).filter((w) => w > 0);
  if (weights.length < 2) return null;

  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const range = max - min || 1;
  const chartH = 120;

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Activity size={18} className="text-brand-600" />
        <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Weight Trend</h3>
      </div>
      <div className="flex items-end gap-2" style={{ height: `${chartH + 30}px` }}>
        {sorted.map((m, i) => {
          const w = Number(m.weight) || 0;
          const h = w > 0 ? ((w - min) / range) * chartH + 20 : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-surface-600 dark:text-surface-300">{w > 0 ? w : '—'}</span>
              <div className="w-full rounded-t bg-brand-600/80 transition-all duration-300" style={{ height: `${h}px` }} />
              <span className="text-[10px] text-surface-500">{formatDate(m.measurement_date).split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function BodyProgress() {
  const dispatch = useDispatch();
  const measurements = useSelector((state) => state.measurements.items);
  const loading = useSelector((state) => state.measurements.loading);

  useEffect(() => { dispatch(fetchMyMeasurements()); }, [dispatch]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  const latest = measurements[0];
  const previous = measurements[1];

  function delta(field) {
    if (!latest || !previous) return null;
    const diff = Number(latest[field]) - Number(previous[field]);
    return diff === 0 ? null : diff;
  }

  const bmi = latest ? calcBMI(Number(latest.weight), Number(latest.height)) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Body Progress</h1>
        <p className="mt-1 text-sm text-surface-500">Track your body measurements over time</p>
      </div>

      {latest ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {FIELDS.slice(0, 5).map((f) => {
              const d = delta(f.key);
              return (
                <Card key={f.key}>
                  <p className="text-xs text-surface-500">{f.label}</p>
                  <p className="mt-2 font-display text-xl font-bold text-ink-950 dark:text-white">{latest[f.key] || '—'}{latest[f.key] && <span className="ml-1 text-xs text-surface-400">{f.unit}</span>}</p>
                  {d !== null && (
                    <p className={`mt-1 flex items-center gap-1 text-xs ${d > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {d > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {d > 0 ? '+' : ''}{d.toFixed(1)}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FIELDS.slice(5).map((f) => {
              const d = delta(f.key);
              return (
                <Card key={f.key}>
                  <p className="text-xs text-surface-500">{f.label}</p>
                  <p className="mt-2 font-display text-xl font-bold text-ink-950 dark:text-white">{latest[f.key] || '—'}{latest[f.key] && <span className="ml-1 text-xs text-surface-400">{f.unit}</span>}</p>
                  {d !== null && (
                    <p className={`mt-1 flex items-center gap-1 text-xs ${d > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {d > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {d > 0 ? '+' : ''}{d.toFixed(1)}
                    </p>
                  )}
                </Card>
              );
            })}
            <Card>
              <p className="text-xs text-surface-500">BMI</p>
              <p className="mt-2 font-display text-xl font-bold text-ink-950 dark:text-white">{bmi || '—'}</p>
              {bmi && <p className="mt-1 text-xs text-surface-500">{Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese'}</p>}
            </Card>
          </div>

          {latest.measurement_date && (
            <p className="text-sm text-surface-500">Last measured on {formatDate(latest.measurement_date)}</p>
          )}

          <TrendChart measurements={measurements} />

          <Card padding={false}>
            <div className="border-b border-surface-200 px-5 py-4 dark:border-surface-800">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Measurement History</h3>
            </div>
            {measurements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Age</th>
                      {FIELDS.map((f) => <th key={f.key} className="px-5 py-3 font-medium">{f.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m) => (
                      <tr key={m.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                        <td className="px-5 py-3 font-medium">{formatDate(m.measurement_date)}</td>
                        <td className="px-5 py-3">{m.age || '—'}</td>
                        {FIELDS.map((f) => <td key={f.key} className="px-5 py-3">{m[f.key] || '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="p-5"><EmptyState title="No measurements yet" description="Your body measurements will appear here once recorded by gym staff." /></div>}
          </Card>
        </>
      ) : (
        <EmptyState title="No measurements yet" description="Your body measurements will appear here once recorded by gym staff. Only gym staff can create measurement records." />
      )}
    </div>
  );
}
