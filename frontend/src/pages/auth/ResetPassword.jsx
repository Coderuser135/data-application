import { useMemo, useState } from 'react';
import { ArrowLeft, Dumbbell, Lock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) return setError('This password reset link is invalid.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true); setError('');
    try {
      await authService.resetPassword({ token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err?.message || 'Unable to reset password. The link may have expired.');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-5 dark:bg-surface-950">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={21} /></span>
          <span className="font-display text-lg font-bold text-ink-950 dark:text-white">IRON<span className="text-brand-500">FORGE</span></span>
        </Link>
        <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          {done ? (
            <div className="text-center"><Lock className="mx-auto text-brand-500" size={42} /><h1 className="mt-4 font-display text-2xl font-bold">Password updated</h1><p className="mt-2 text-sm text-surface-500">Redirecting you to login...</p></div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Create a new password</h1>
              <p className="mt-2 text-sm text-surface-500">Choose a strong password with at least 8 characters.</p>
              {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
                <Button type="submit" loading={loading} className="w-full" size="lg">Reset password</Button>
              </form>
              <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-brand-600"><ArrowLeft size={15} /> Back to login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
