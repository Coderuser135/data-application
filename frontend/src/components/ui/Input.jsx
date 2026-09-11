export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block space-y-2">
      {label && <span className="text-sm font-medium text-ink-700 dark:text-surface-200">{label}</span>}
      <input className={`w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white ${error ? 'border-red-500' : ''} ${className}`} {...props} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}
