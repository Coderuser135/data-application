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
      .then((items) => {
        if (mounted) {
          setBanners(Array.isArray(items) ? items : []);
          setActiveIndex(0);
        }
      })
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
  const hasOverlayContent = Boolean(active.title || active.description || (active.button_text && active.button_link));
  const link = active.button_link || '';
  const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-xl ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70';

  const action = active.button_text && link
    ? (link.startsWith('/')
      ? <Link to={link} className={actionClass}>{active.button_text}<ArrowUpRight size={17} /></Link>
      : <a href={link} target="_blank" rel="noopener noreferrer" className={actionClass}>{active.button_text}<ArrowUpRight size={17} /></a>)
    : null;

  return (
    <section
      className="relative isolate min-h-[190px] overflow-hidden rounded-[26px] bg-ink-950 shadow-lg sm:min-h-[260px] lg:min-h-[320px]"
      aria-label={section === 'gym' ? 'Gym promotions' : 'Supplement Store promotions'}
    >
      <img
        src={active.image_url}
        alt={active.title || (section === 'gym' ? 'Heaven Gym promotional banner' : 'Supplement Store promotional banner')}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      {hasOverlayContent && <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/50 to-black/5" />}
      {hasOverlayContent && (
        <div key={active._id || activeIndex} className="relative z-[2] flex min-h-[190px] flex-col items-start justify-center px-5 py-8 sm:min-h-[260px] sm:px-9 lg:min-h-[320px] lg:px-12">
          {active.title && <h2 className="max-w-2xl font-display text-2xl font-extrabold leading-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl">{active.title}</h2>}
          {active.description && <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white drop-shadow sm:text-base">{active.description}</p>}
          {action && <div className="mt-5">{action}</div>}
        </div>
      )}
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 right-3 z-[3] flex items-center gap-2 sm:bottom-5 sm:right-5">
            <button type="button" aria-label="Previous banner" onClick={() => setActiveIndex((activeIndex - 1 + banners.length) % banners.length)} className="grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronLeft size={19} /></button>
            <button type="button" aria-label="Next banner" onClick={() => setActiveIndex((activeIndex + 1) % banners.length)} className="grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronRight size={19} /></button>
          </div>
          <div className="absolute bottom-5 left-5 z-[3] flex max-w-[55%] items-center gap-1.5 sm:left-9 lg:left-12">
            {banners.map((banner, index) => (
              <button key={banner._id || index} type="button" aria-label={`Show banner ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)} className={`h-2 rounded-full border border-white/70 shadow transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-black/35 hover:bg-white/80'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
