import { AlertTriangle, LoaderCircle, LogOut, MonitorSmartphone, X } from 'lucide-react';

export default function LogoutConfirmDialog({ open, activeDevices, loading, error, submitting, onCancel, onRetry, onLogout, onLogoutAll }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title" className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-700 dark:bg-surface-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"><LogOut size={21} /></div>
          <button type="button" onClick={onCancel} disabled={submitting} aria-label="Close logout confirmation" className="rounded-lg p-2 text-surface-400 transition hover:bg-surface-100 hover:text-surface-700 disabled:opacity-50 dark:hover:bg-surface-800"><X size={18} /></button>
        </div>
        <h2 id="logout-dialog-title" className="mt-4 font-display text-xl font-bold text-ink-950 dark:text-white">Confirm logout</h2>
        <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">Choose whether to sign out from this device only or from every device using this account.</p>
        {loading ? (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-500 dark:bg-surface-800"><LoaderCircle size={17} className="animate-spin" /> Checking your active devices…</div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"><p>{error}</p><button type="button" onClick={onRetry} className="mt-2 font-semibold underline underline-offset-2">Try again</button></div>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-surface-50 p-3 dark:bg-surface-800"><MonitorSmartphone size={20} className="text-surface-500" /><div><p className="text-sm font-semibold text-ink-900 dark:text-white">{activeSessions} active {activeSessions === 1 ? 'device session' : 'device sessions'}</p><p className="text-xs text-surface-500">Includes this device</p></div></div>
            {activeSessions > 1 && <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> Logout all will end every active device session, including this device.</div>}
          </>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-xl border border-surface-200 px-4 py-3 text-sm font-semibold text-surface-700 transition hover:bg-surface-50 disabled:opacity-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800">Cancel</button>
          <button type="button" onClick={onLogout} disabled={loading || Boolean(error) || submitting} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Logging out…' : 'Logout'}</button>
          {activeSessions > 1 && !loading && !error && <button type="button" onClick={onLogoutAll} disabled={submitting} className="col-span-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">{submitting ? 'Please wait…' : 'Logout all devices'}</button>}
        </div>
      </section>
    </div>
  );
}
