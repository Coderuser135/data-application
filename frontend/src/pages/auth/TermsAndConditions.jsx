import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';

const sections = [
  { title: '1. Age Eligibility (18+)', body: 'Heaven Gym account, online membership aur services sirf 18 saal ya usse zyada age ke logon ke liye hain. Account create karke aap confirm karte hain ki aap 18+ hain. Agar aap 18 saal se kam hain, to account create na karein aur membership purchase na karein.' },
  { title: '2. Account Information', body: 'Aap apna sahi naam, email aur contact details dene aur apne login credentials ko secure rakhne ke zimmedar hain. Apne account ka unauthorized use dikhe to gym management ko turant inform karein.' },
  { title: '3. Membership & Payments', body: 'Membership ka duration, plan, included facilities aur applicable charges payment se pehle clearly check karein. Membership kisi doosre person ko transfer nahi ki ja sakti, jab tak Heaven Gym written approval na de.' },
  { title: '4. No-Refund Policy', body: 'Membership fee aur paid services ke liye payment complete hone ke baad refund nahi diya jayega. Unused days, personal reasons, late arrival ya membership use na kar paane par refund nahi milega. Yeh policy duplicate/galat charge, Heaven Gym ki taraf se service cancel hone, ya applicable law ke tahat zaroori refund ko override nahi karti.' },
  { title: '5. Gym Rules & Safety', body: 'Members ko gym staff ke instructions, equipment safety rules aur facility guidelines follow karni hongi. Equipment ko responsibly use karein aur unsafe ya disruptive behaviour se bachein.' },
  { title: '6. Account Suspension', body: 'Fraud, false age details, payment misuse, abusive behaviour ya safety rules ke serious violation par Heaven Gym account ya membership access ko review karke suspend kar sakta hai, applicable law ke subject to.' },
  { title: '7. Policy Updates & Contact', body: 'Heaven Gym zaroorat ke hisaab se in terms ko update kar sakta hai. Updated terms website par publish honge. Kisi clarification ke liye gym reception/management se contact karein.' },
];

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-surface-50 px-4 py-8 dark:bg-surface-950 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-8">
        <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"><ArrowLeft size={16} /> Back to registration</Link>
        <div className="mt-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={20} /></span><span className="font-display text-lg font-bold text-ink-950 dark:text-white">HEAVEN<span className="text-brand-500">GYM</span></span></div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-brand-600">Please read before creating an account</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-950 dark:text-white">Terms & Conditions</h1>
        <p className="mt-3 text-sm leading-6 text-surface-500 dark:text-surface-400">Last updated: 8 November 2026. Ye terms Heaven Gym account, membership aur related services ke use par apply hote hain.</p>
        <div className="mt-7 space-y-6">{sections.map((section) => <section key={section.title}><h2 className="font-semibold text-ink-900 dark:text-white">{section.title}</h2><p className="mt-2 text-sm leading-7 text-surface-600 dark:text-surface-300">{section.body}</p></section>)}</div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Important: Refund terms ko launch se pehle local consumer-protection rules aur actual gym policy ke hisaab se owner/legal advisor se review karwa lena chahiye. Applicable legal rights ko yeh policy remove nahi karti.</div>
        <Link to="/register" className="mt-8 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 hover:bg-brand-400">Back to create account</Link>
      </article>
    </main>
  );
}
