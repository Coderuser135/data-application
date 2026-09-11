export default function SectionHeading({ eyebrow, title, description, action }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>}<h2 className="font-display text-3xl font-bold tracking-tight text-ink-950 dark:text-white">{title}</h2>{description && <p className="mt-2 max-w-2xl text-surface-600 dark:text-surface-400">{description}</p>}</div>{action}</div>;
}
