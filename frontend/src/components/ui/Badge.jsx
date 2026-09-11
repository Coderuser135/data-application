export default function Badge({ children, tone = 'neutral' }) {
  const tones = { success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', danger: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400', info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tones[tone]}`}>{children}</span>;
}
