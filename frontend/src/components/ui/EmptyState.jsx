import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description = 'When you have something to see, it will appear here.' }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 px-6 py-16 text-center dark:border-surface-700"><div className="mb-4 rounded-2xl bg-surface-100 p-4 text-surface-400 dark:bg-surface-800"><Inbox size={28} /></div><h3 className="font-semibold text-ink-900 dark:text-white">{title}</h3><p className="mt-2 max-w-sm text-sm text-surface-500">{description}</p></div>;
}
