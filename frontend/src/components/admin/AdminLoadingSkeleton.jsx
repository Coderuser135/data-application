export default function AdminLoadingSkeleton({ variant = 'dashboard', rows = 5 }) {
  if (variant === 'table') {
    return (
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900" aria-label="Loading records">
        <div className="mb-5 flex items-center justify-between">
          <div className="admin-skeleton h-5 w-40" />
          <div className="admin-skeleton h-9 w-28 rounded-lg" />
        </div>
        <div className="space-y-5">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid grid-cols-4 items-center gap-4 sm:grid-cols-6">
              <div className="admin-skeleton h-4 w-3/4" />
              <div className="admin-skeleton hidden h-4 w-4/5 sm:block" />
              <div className="admin-skeleton h-4 w-2/3" />
              <div className="admin-skeleton h-6 w-16 rounded-full" />
              <div className="admin-skeleton hidden h-4 w-2/3 sm:block" />
              <div className="admin-skeleton hidden h-8 w-16 rounded-lg sm:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading plans">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
            <div className="admin-skeleton h-5 w-2/3" />
            <div className="admin-skeleton mt-3 h-3 w-1/3" />
            <div className="admin-skeleton mt-7 h-8 w-1/2" />
            <div className="admin-skeleton mt-5 h-3 w-full" />
            <div className="admin-skeleton mt-2 h-3 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div>
        <div className="admin-skeleton h-7 w-52" />
        <div className="admin-skeleton mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
            <div className="admin-skeleton h-10 w-10 rounded-xl" />
            <div className="admin-skeleton mt-5 h-3 w-24" />
            <div className="admin-skeleton mt-2 h-8 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
        <div className="admin-skeleton h-5 w-44" />
        <div className="admin-skeleton mt-5 h-44 w-full rounded-xl" />
      </div>
    </div>
  );
}
