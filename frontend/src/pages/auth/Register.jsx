import { useState } from 'react';
import { Dumbbell, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signUp } from '@/redux/slices/authSlice';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function update(key, value) { setForm((f) => ({ ...f, [key]: value })); }
  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try { await dispatch(signUp({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone })).unwrap(); navigate('/user/dashboard'); }
    catch (err) { setError(typeof err === 'string' ? err : 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  }
  const benefits = ['Full gym access with membership', 'Track your body progress', 'Shop supplements online', 'Manage payments and orders'];
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-ink-950 lg:block"><div className="absolute inset-0 bg-hero-grid bg-[size:42px_42px] opacity-15" /><div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-[100px]" /><div className="relative flex h-full flex-col justify-between p-12 text-white"><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-ink-950"><Dumbbell size={21} /></span><span className="font-display text-lg font-bold">IRON<span className="text-brand-400">FORGE</span></span></Link><div><p className="font-display text-4xl font-bold leading-tight">Start your<br /><span className="text-brand-400">strongest chapter.</span></p><ul className="mt-8 space-y-4">{benefits.map((b) => <li key={b} className="flex items-center gap-3 text-surface-300"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-400"><Check size={14} /></span>{b}</li>)}</ul></div><p className="text-xs text-surface-500">© {new Date().getFullYear()} IronForge Fitness</p></div></div>
      <div className="flex w-full items-center justify-center bg-surface-50 px-5 py-12 dark:bg-surface-950 lg:w-1/2"><div className="w-full max-w-md"><Link to="/" className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={21} /></span><span className="font-display text-lg font-bold text-ink-950 dark:text-white">IRON<span className="text-brand-500">FORGE</span></span></Link><h1 className="font-display text-3xl font-bold text-ink-950 dark:text-white">Create your account</h1><p className="mt-2 text-sm text-surface-500">Join IronForge and start training with purpose</p>{error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</div>}<form onSubmit={handleSubmit} className="mt-7 space-y-5"><Input label="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="e.g. Rahul Sharma" required /><Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" required /><Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" /><Input label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 8 characters" minLength={8} required /><Input label="Confirm password" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Re-enter password" minLength={8} required /><Button type="submit" loading={loading} className="w-full" size="lg">Create account <ArrowRight size={16} /></Button></form><p className="mt-7 text-center text-sm text-surface-500">Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link></p></div></div>
    </div>
  );
}
