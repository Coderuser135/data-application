import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bannerService } from '@/services/bannerService';

export default function BannerCarousel({ section, children = null }) {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    bannerService.getActive(section)
      .then((items) => { if (mounted) { setBanners(Array.isArray(items) ? items : []); setActiveIndex(0); } })
      .catch(() => { if (mounted) setBanners([]); });
    return () => { mounted = false; };
  }, [section]);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return children;
  const active = banners[activeIndex];
  const link = active.button_link || '';
  const action = active.button_text && link
    ? (link.startsWith('/') ? <Link to={link} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-ink-950 shadow-lg transition hover:bg-brand-50">{active.button_text}<ArrowUpRight size={16} /></Link>
      : <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-ink-950 shadow-lg transition hover:bg-brand-50">{active.button_text}<ArrowUpRight size={16} /></a>)
    : null;

  return (
    <section className="relative isolate min-h-[230px] overflow-hidden rounded-[26px] bg-ink-950 text-white shadow-lg sm:min-h-[280px] lg:min-h-[320px]" aria-label={section === 'gym' ? 'Gym promotions' : 'Supplement Store promotions'}>
      <img src={active.image_url} alt={active.title} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
      <div key={active._id || activeIndex} className="flex min-h-[230px] animate-[fadeIn_.45s_ease] flex-col items-start justify-center px-6 py-9 sm:min-h-[280px] sm:px-10 lg:min-h-[320px] lg:px-14">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">{section === 'gym' ? 'Heaven Gym' : 'Supplement Store'}</p>
        <h2 className="max-w-2xl font-display text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">{active.title}</h2>
        {active.description && <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">{active.description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
      {banners.length > 1 && <>
        <div className="absolute bottom-4 right-5 flex items-center gap-2 sm:bottom-6 sm:right-8">
          <button type="button" aria-label="Previous banner" onClick={() => setActiveIndex((activeIndex - 1 + banners.length) % banners.length)} className="rounded-full border border-white/30 bg-black/25 p-2 text-white backdrop-blur transition hover:bg-black/50"><ChevronLeft size={17} /></button>
          <button type="button" aria-label="Next banner" onClick={() => setActiveIndex((activeIndex + 1) % banners.length)} className="rounded-full border border-white/30 bg-black/25 p-2 text-white backdrop-blur transition hover:bg-black/50"><ChevronRight size={17} /></button>
        </div>
        <div className="absolute bottom-5 left-6 flex items-center gap-1.5 sm:left-10 lg:left-14">
          {banners.map((banner, index) => <button key={banner._id || index} type="button" aria-label={`Show banner ${index + 1}`} onClick={() => setActiveIndex(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} />)}
        </div>
      </>}
    </section>
  );
}
