import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';

const sections = [
  {
    title: '1. Who manages your information?',
    body: 'Heaven Gym gym management decides why member information is collected and how it is used for gym operations. The application developer may provide technical maintenance only when authorised by the gym. For questions about your account or information, contact Heaven Gym reception/management.'
  },
  {
    title: '2. What information may be collected?',
    body: 'Depending on the features you use, the application may collect your name, email address, phone number, account and login-session details, membership and admission records, payment status and transaction references, orders and delivery/pickup details, and body measurements or progress entries that you or authorised gym staff add.'
  },
  {
    title: '3. Why is information used?',
    body: 'Information is used to create and secure accounts, verify email addresses, manage gym admissions and memberships, record payments, process store orders, provide member support, maintain body-progress records when requested, prevent misuse, and operate and improve the application.'
  },
  {
    title: '4. Payments',
    body: 'When online payments are enabled, payment processing is handled through the configured payment gateway. The application may store transaction references, order identifiers, payment status and amount for reconciliation. Do not share your card PIN, UPI PIN, CVV or OTP with gym staff or the application. Payment credentials should be entered only in the payment provider checkout.'
  },
  {
    title: '5. Who may access information?',
    body: 'Authorised Heaven Gym administrators may access member information needed to manage memberships, admissions, payments and orders. Hosting, database, email and payment service providers may process limited information to provide their services. Access should be restricted to people and providers who need it for the stated purposes.'
  },
  {
    title: '6. Security and retention',
    body: 'Heaven Gym and its authorised technical providers should use reasonable access controls and security safeguards. Information should be kept only as long as needed for gym operations, account support, dispute handling and applicable legal or accounting requirements, and then securely deleted or anonymised when no longer required. Some records may need to be retained where law requires.'
  },
  {
    title: '7. Your choices and requests',
    body: 'You may contact Heaven Gym management to ask about your information, request correction of inaccurate details, or raise a privacy concern. Some information may need to be retained to complete transactions or meet legal obligations. The gym should review and respond to requests under applicable law.'
  },
  {
    title: '8. Age eligibility',
    body: 'The current online registration flow is intended for people aged 18 years or older. Do not create an account if you are under 18. The age checkbox is a self-declaration and is not identity-document verification.'
  },
  {
    title: '9. Policy updates and contact',
    body: 'This notice may be updated when the application or its data practices change. For privacy questions, contact Heaven Gym reception or management using the contact details officially provided by the gym.'
  }
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-surface-50 px-4 py-8 dark:bg-surface-950 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"><ArrowLeft size={16} /> Back to Heaven Gym</Link>
        <div className="mt-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={20} /></span><span className="font-display text-lg font-bold text-ink-950 dark:text-white">HEAVEN<span className="text-brand-500">GYM</span></span></div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-brand-600">Member information</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-950 dark:text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-6 text-surface-500 dark:text-surface-400">Plain-language overview of information used by the Heaven Gym application. The gym owner must verify this notice against the actual services, providers, contact details and applicable law before public launch.</p>
        <div className="mt-7 space-y-6">{sections.map((section) => <section key={section.title}><h2 className="font-semibold text-ink-900 dark:text-white">{section.title}</h2><p className="mt-2 text-sm leading-7 text-surface-600 dark:text-surface-300">{section.body}</p></section>)}</div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Owner action required: add the gym's correct legal/business name, address, privacy contact and actual service-provider details before production launch. This page is an implementation starting point, not a legal compliance certificate.</div>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/terms-and-conditions" className="rounded-xl border border-surface-200 px-4 py-3 text-sm font-semibold text-surface-700 dark:border-surface-700 dark:text-surface-200">Terms & Conditions</Link><Link to="/contact" className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 hover:bg-brand-400">Contact the gym</Link></div>
      </article>
    </main>
  );
}
