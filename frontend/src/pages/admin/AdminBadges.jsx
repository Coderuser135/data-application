import { Link } from 'react-router-dom';
import { Dumbbell, ShoppingBag, ArrowRight, PanelsTopLeft } from 'lucide-react';
import Card from '@/components/ui/Card';

export default function AdminBadges() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400"><PanelsTopLeft size={18} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Promotional content</span></div>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-950 dark:text-white">Banner</h1>
        <p className="mt-1 text-sm text-surface-500">Choose which part of the application you want to manage banners for.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Link to="/admin/banners/gym" className="group">
          <Card className="h-full border border-emerald-200/80 bg-emerald-50/60 transition hover:-translate-y-1 hover:shadow-lg dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><Dumbbell size={24} /></span>
            <h2 className="mt-5 font-display text-xl font-bold text-ink-950 dark:text-white">Gym</h2>
            <p className="mt-2 text-sm leading-6 text-surface-500">Manage gym offers, membership promotions, training announcements and gym-wide banners.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">Manage Gym Banners <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Card>
        </Link>
        <Link to="/admin/banners/store" className="group">
          <Card className="h-full border border-violet-200/80 bg-violet-50/60 transition hover:-translate-y-1 hover:shadow-lg dark:border-violet-500/20 dark:bg-violet-500/[0.06]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-400"><ShoppingBag size={24} /></span>
            <h2 className="mt-5 font-display text-xl font-bold text-ink-950 dark:text-white">Supplement Store</h2>
            <p className="mt-2 text-sm leading-6 text-surface-500">Manage supplement offers, product promotions, new arrivals and store announcements.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-400">Manage Store Banners <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
