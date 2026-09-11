import { useState } from 'react';
import { Dumbbell, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-5 dark:bg-surface-950">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={21} /></span>
          <span className="font-display text-lg font-bold text-ink-950 dark:text-white">IRON<span className="text-brand-500">FORGE</span></span>
        </Link>
        <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Mail size={26} /></span>
              <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Check your email</h1>
              <p className="mt-2 text-sm text-surface-500">We've sent a password reset link to <span className="font-semibold text-ink-900 dark:text-white">{email}</span></p>
              <Link to="/login" className="mt-6 inline-block"><Button variant="secondary"><ArrowLeft size={16} /> Back to login</Button></Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Forgot password?</h1>
              <p className="mt-2 text-sm text-surface-500">Enter your email and we'll send you a reset link</p>
              {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                <Button type="submit" loading={loading} className="w-full" size="lg">Send reset link</Button>
              </form>
              <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"><ArrowLeft size={15} /> Back to login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
