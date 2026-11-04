import { Clock3, MapPin, Phone, ExternalLink } from 'lucide-react';
import { gymProfile } from '@/config/gymProfile';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Contact() {
  return (
    <div>
      <section className="bg-ink-950 pb-20 pt-36 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-400">Contact Heaven Gym</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold tracking-[-.04em] sm:text-6xl">Your fitness journey<br /><span className="text-brand-400">starts here.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-surface-300">Visit us at Jhanda Chowk, Purnia. Call the gym for membership details and current availability.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <SectionHeading eyebrow="Find Heaven Gym" title="Come by the gym." description="We are near the LG showroom at Jhanda Chowk, Naya Tola, Purnia." />
            <div className="mt-10 space-y-7">
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"><MapPin size={18} /></span>
                <div><p className="text-sm font-semibold text-ink-900 dark:text-white">Address</p><p className="mt-1 text-sm leading-6 text-surface-500">{gymProfile.address}</p><a href={gymProfile.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Open in Google Maps <ExternalLink size={14} /></a></div>
              </div>
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"><Phone size={18} /></span>
                <div><p className="text-sm font-semibold text-ink-900 dark:text-white">Phone</p><a href={`tel:${gymProfile.phoneHref}`} className="mt-1 block text-sm text-surface-500 hover:text-brand-600">{gymProfile.phone}</a></div>
              </div>
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"><Clock3 size={18} /></span>
                <div><p className="text-sm font-semibold text-ink-900 dark:text-white">Opening hours</p>{gymProfile.hours.map((item) => <p key={item.days} className="mt-1 text-sm text-surface-500">{item.days}: {item.time}</p>)}</div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <iframe title="Heaven Gym location map" src="https://www.google.com/maps?q=Heaven+Gym%2C+Jhanda+Chowk%2C+Purnia%2C+Bihar+854301&output=embed" className="h-[360px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className="p-6"><h3 className="font-display text-xl font-bold text-ink-950 dark:text-white">Heaven Gym, Purnia</h3><p className="mt-2 text-sm text-surface-500">{gymProfile.address}</p><a href={gymProfile.mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block"><Button>Get directions <ExternalLink size={15} /></Button></a></div>
          </div>
        </div>
      </section>
    </div>
  );
}
