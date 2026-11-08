import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authService } from '@/services/authService';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      await authService.verifyEmail({ email, otp });
      setMessage('Email verified. Please sign in to continue.');
      navigate('/login', { replace: true, state: { verified: true, email } });
    } catch (err) { setError(err.response?.data?.error || 'Could not verify this code.'); }
    finally { setLoading(false); }
  }
  async function handleResend() {
    setResending(true); setError(''); setMessage('');
    try {
      const result = await authService.resendVerificationOtp({ email });
      setMessage(result.message || 'If verification is pending, a new code has been sent.');
    } catch (err) { setError(err.response?.data?.error || 'Could not resend the code.'); }
    finally { setResending(false); }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-5 py-12 dark:bg-surface-950">
      <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-7 shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <Link to="/" className="mb-8 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={21} /></span><span className="font-display text-lg font-bold text-ink-950 dark:text-white">HEAVEN<span className="text-brand-500">GYM</span></span></Link>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Verify your email</h1>
        <p className="mt-2 text-sm text-surface-500">Enter the 6-digit code sent to your email. The code expires in 5 minutes.</p>
        {message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleVerify} className="mt-7 space-y-5">
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="6-digit verification code" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} required />
          <Button type="submit" loading={loading} className="w-full" size="lg">Verify email <ArrowRight size={16} /></Button>
        </form>
        <button type="button" onClick={handleResend} disabled={resending || !email} className="mt-5 w-full text-sm font-semibold text-brand-600 disabled:opacity-50">{resending ? 'Sending…' : 'Resend verification code'}</button>
        <p className="mt-6 text-center text-sm text-surface-500">Already verified? <Link to="/login" className="font-semibold text-brand-600">Sign in</Link></p>
      </div>
    </div>
  );
}
