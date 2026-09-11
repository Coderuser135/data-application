import { useState } from 'react';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signIn } from '@/redux/slices/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await dispatch(signIn({ email, password })).unwrap();
      if (result.user) {
        navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 bg-hero-grid bg-[size:42px_42px] opacity-15" />
        <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-[100px]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-ink-950"><Dumbbell size={21} /></span>
            <span className="font-display text-lg font-bold">IRON<span className="text-brand-400">FORGE</span></span>
          </Link>
          <div>
            <p className="font-display text-4xl font-bold leading-tight">Welcome back.<br /><span className="text-brand-400">Let's get to work.</span></p>
            <p className="mt-4 max-w-sm text-surface-400">Your training, your progress, your supplements — all in one place.</p>
          </div>
          <p className="text-xs text-surface-500">© {new Date().getFullYear()} IronForge Fitness</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-surface-50 px-5 py-12 dark:bg-surface-950 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={21} /></span>
            <span className="font-display text-lg font-bold text-ink-950 dark:text-white">IRON<span className="text-brand-500">FORGE</span></span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink-950 dark:text-white">Sign in</h1>
          <p className="mt-2 text-sm text-surface-500">Enter your credentials to access your account</p>
          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Sign in <ArrowRight size={16} /></Button>
          </form>
          <p className="mt-7 text-center text-sm text-surface-500">Don't have an account? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}
