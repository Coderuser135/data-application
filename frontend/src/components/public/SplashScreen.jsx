import { useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  useEffect(() => { const timer = setTimeout(onComplete, 1200); return () => clearTimeout(timer); }, [onComplete]);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950 text-white"><div className="animate-fade-up text-center"><div className="mx-auto flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-brand-500 text-ink-950 shadow-2xl shadow-brand-500/20"><Dumbbell size={38} strokeWidth={2.2} /></div><h1 className="mt-7 font-display text-3xl font-bold tracking-tight">IRON<span className="text-brand-400">FORGE</span></h1><p className="mt-2 text-xs uppercase tracking-[.3em] text-surface-400">Train with intent</p><div className="mx-auto mt-8 h-1 w-32 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-brand-400" /></div></div></div>;
}
