import Link from "next/link";

interface ComingSoonProps {
  icon: string;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
}

export function ComingSoon({ icon, name, tagline, description, bullets }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-6xl mb-6">{icon}</span>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-5">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Coming Soon
      </span>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">{name}</h1>
      <p className="mt-3 text-lg text-slate-500 dark:text-slate-400 max-w-md">{tagline}</p>

      <div className="mt-8 w-full max-w-sm rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-left">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">What to expect</p>
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">{description}</p>

      <Link
        href="/recommend"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
      >
        Get recommendations now
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  );
}
