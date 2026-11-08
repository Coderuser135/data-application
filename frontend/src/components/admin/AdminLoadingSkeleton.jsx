export default function AdminLoadingSkeleton({ variant = 'dashboard', rows = 5 }) {
  if (variant === 'section') {
    return (
      <div className="space-y-6" role="status" aria-label="Loading admin section" aria-busy="true">
        <div><div className="admin-skeleton h-7 w-52" /><div className="admin-skeleton mt-2 h-4 w-72 max-w-full" /></div>
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="admin-skeleton h-5 w-36" /><div className="admin-skeleton h-11 w-full rounded-xl sm:max-w-sm" /></div></div>
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-5 flex items-center justify-between"><div className="admin-skeleton h-5 w-40" /><div className="admin-skeleton h-8 w-24 rounded-lg" /></div>
          <div className="space-y-5">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="grid grid-cols-4 items-center gap-4 sm:grid-cols-6"><div className="admin-skeleton h-4 w-3/4" /><div className="admin-skeleton hidden h-4 w-4/5 sm:block" /><div className="admin-skeleton h-4 w-2/3" /><div className="admin-skeleton h-6 w-16 rounded-full" /><div className="admin-skeleton hidden h-4 w-2/3 sm:block" /><div className="admin-skeleton hidden h-8 w-16 rounded-lg sm:block" /></div>)}</div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="admin-skeleton h-4 w-44" /><div className="flex items-center gap-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="admin-skeleton h-9 w-9 rounded-lg" />)}</div></div>
      </div>
    );
  }

  if (variant === 'measurement') {
    return (
      <div className="space-y-5 sm:space-y-6" role="status" aria-label="Loading body measurements" aria-busy="true">
        <div><div className="admin-skeleton h-7 w-56" /><div className="admin-skeleton mt-2 h-4 w-80 max-w-full" /></div>
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="admin-skeleton h-5 w-36" /><div className="admin-skeleton mt-2 h-3 w-28" /></div><div className="admin-skeleton h-11 w-full rounded-xl sm:max-w-sm" /></div></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900"><div className="flex items-start gap-3"><div className="admin-skeleton h-12 w-12 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><div className="admin-skeleton h-4 w-3/4" /><div className="admin-skeleton mt-2 h-3 w-full" /><div className="admin-skeleton mt-2 h-3 w-2/3" /></div></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-200 pt-3 dark:border-surface-800"><div><div className="admin-skeleton h-3 w-16" /><div className="admin-skeleton mt-2 h-4 w-20" /></div><div><div className="admin-skeleton h-3 w-20" /><div className="admin-skeleton mt-2 h-4 w-24" /></div></div><div className="admin-skeleton mt-4 h-3 w-40" /></div>)}
        </div>
        <div className="flex flex-col gap-3 border-t border-surface-200 pt-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between"><div className="admin-skeleton h-4 w-48" /><div className="flex items-center gap-2"><div className="admin-skeleton h-9 w-16 rounded-lg" />{Array.from({ length: 5 }).map((_, index) => <div key={index} className="admin-skeleton h-8 w-8 rounded-lg" />)}<div className="admin-skeleton h-9 w-16 rounded-lg" /></div></div>
      </div>
    );
  }
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

  if (variant === 'chart') {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900" aria-label="Loading analytics">
        <div className="flex items-center justify-between gap-3">
          <div className="admin-skeleton h-5 w-40" />
          <div className="admin-skeleton h-8 w-28 rounded-lg" />
        </div>
        <div className="mt-6 flex h-44 items-end gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="admin-skeleton flex-1 rounded-t-md" style={{ height: `${28 + ((index * 29) % 105)}px` }} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'details') {
    return (
      <div className="space-y-5 p-5" aria-label="Loading admission details">
        <div className="admin-skeleton h-5 w-44" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-surface-200 p-4 dark:border-surface-800">
              <div className="admin-skeleton h-3 w-24" />
              <div className="admin-skeleton mt-3 h-4 w-3/4" />
            </div>
          ))}
        </div>
        <div className="admin-skeleton h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="space-y-6" aria-label="Loading form">
        <div>
          <div className="admin-skeleton h-7 w-40" />
          <div className="admin-skeleton mt-2 h-4 w-64" />
        </div>
        <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
          <div className="admin-skeleton mb-6 h-5 w-44" />
          <div className="space-y-5">
            <div className="admin-skeleton h-11 w-full rounded-lg" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="admin-skeleton h-11 rounded-lg" />
              <div className="admin-skeleton h-11 rounded-lg" />
            </div>
            <div className="admin-skeleton h-11 w-full rounded-lg" />
          </div>
        </div>
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
