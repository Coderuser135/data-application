export default function Card({ children, className = '', padding = true }) {
  return <div className={`rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900 ${padding ? 'p-5' : ''} ${className}`}>{children}</div>;
}
