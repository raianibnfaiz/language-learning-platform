import { Link } from 'react-router-dom'
import { languages } from '../data/languages'
import { currentYear } from '../lib/dates'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200/70 dark:border-slate-800">
      <div className="grid gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            Lingua<span className="text-primary-600">Wealth</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Learn the five languages that unlock the most economic opportunity, ranked by GDP access,
            trade utility, diplomatic weight and wage premiums.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Languages</p>
          <ul className="mt-3 space-y-2 text-sm">
            {languages.map((l) => (
              <li key={l.id}>
                <Link to={`/languages/${l.id}`} className="text-slate-500 hover:text-primary-600 dark:text-slate-400">
                  {l.flag} {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Platform</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ['/', 'Dashboard'],
              ['/practice', 'Practice'],
              ['/progress', 'Progress'],
              ['/about', 'Why these 5?'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-slate-500 hover:text-primary-600 dark:text-slate-400">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/70 px-4 py-4 text-xs text-slate-400 sm:px-6 dark:border-slate-800">
        © {currentYear()} LinguaWealth. Rankings based on the Airlearn Language Show episode.
      </div>
    </footer>
  )
}
