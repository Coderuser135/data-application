import { useState } from 'react';
import { ArrowLeft, Dumbbell, LockKeyRound, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function getError(requestError, fallback) {
    return requestError.response?.data?.error || requestError.message || fallback;
  }

  async function handleSendCode(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await authService.forgotPassword({ email });
      setStep('otp');
      setMessage(result.message || 'If this account is registered and verified, a reset code will be sent.');
    } catch (requestError) {
      setError(getError(requestError, 'Could not send the reset code. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await authService.verifyPasswordResetOtp({ email, otp });
      setResetToken(result.resetToken);
      setStep('password');
      setMessage('Email code verified. You can now create a new password.');
    } catch (requestError) {
      setError(getError(requestError, 'The reset code could not be verified.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token: resetToken, newPassword });
      navigate('/login', {
        replace: true,
        state: { message: 'Password updated successfully. Please sign in with your new password.' },
      });
    } catch (requestError) {
      setError(getError(requestError, 'Unable to update your password. Please verify your email code again.'));
    } finally {
      setLoading(false);
    }
  }

  const stepTitle = step === 'email'
    ? 'Forgot password?'
    : step === 'otp'
      ? 'Verify your email'
      : 'Create a new password';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-5 dark:bg-surface-950">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={21} /></span>
          <span className="font-display text-lg font-bold text-ink-950 dark:text-white">HEAVEN<span className="text-brand-500">GYM</span></span>
        </Link>
        <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {step === 'email' ? <Mail size={22} /> : step === 'otp' ? <Mail size={22} /> : <LockKeyRound size={22} />}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">{stepTitle}</h1>
          <p className="mt-2 text-sm text-surface-500">
            {step === 'email' && 'Enter your registered email. We will send you a 6-digit reset code.'}
            {step === 'otp' && <>Enter the 6-digit code sent to <span className="font-semibold text-ink-900 dark:text-white">{email}</span>. The code expires in 5 minutes.</>}
            {step === 'password' && 'Your email is verified. Choose a new password for your account.'}
          </p>

          {message && <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="mt-7 space-y-5">
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
              <Button type="submit" loading={loading} className="w-full" size="lg">Send reset code</Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyCode} className="mt-7 space-y-5">
              <Input label="6-digit reset code" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoComplete="one-time-code" required />
              <Button type="submit" loading={loading} disabled={otp.length !== 6} className="w-full" size="lg">Verify code</Button>
              <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); setMessage(''); }} className="w-full text-sm font-medium text-brand-600 hover:text-brand-700">Change email address</button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="mt-7 space-y-5">
              <Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required />
              <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required />
              <p className="text-xs text-surface-500">Use at least 12 characters. Maximum 72 UTF-8 bytes.</p>
              <Button type="submit" loading={loading} className="w-full" size="lg">Update password</Button>
            </form>
          )}

          <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            <ArrowLeft size={15} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
