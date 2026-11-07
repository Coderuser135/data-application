import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    }, 4000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return children;

  const active = banners[activeIndex];

  return (
    <section
      className="relative isolate h-[150px] w-full overflow-hidden rounded-2xl bg-ink-950 shadow-lg sm:h-[210px] sm:rounded-[22px] lg:h-[250px]"
      aria-label={section === 'gym' ? 'Gym promotional banners' : 'Supplement Store promotional banners'}
    >
      <img
        key={active._id || activeIndex}
        src={active.image_url}
        alt={section === 'gym' ? 'Heaven Gym promotional banner' : 'Supplement Store promotional banner'}
        className="absolute inset-0 h-full w-full object-cover animate-banner-change"
      />
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 sm:bottom-5 sm:right-5">
            <button type="button" aria-label="Previous banner" onClick={() => setActiveIndex((activeIndex - 1 + banners.length) % banners.length)} className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronLeft size={19} /></button>
            <button type="button" aria-label="Next banner" onClick={() => setActiveIndex((activeIndex + 1) % banners.length)} className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronRight size={19} /></button>
          </div>
          <div className="absolute bottom-5 left-5 z-10 flex max-w-[55%] items-center gap-1.5 sm:left-9">
            {banners.map((banner, index) => (
              <button key={banner._id || index} type="button" aria-label={`Show banner ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)} className={`h-2 rounded-full border border-white/70 shadow transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-black/35 hover:bg-white/80'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
