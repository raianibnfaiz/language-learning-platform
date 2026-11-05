import { ArrowRight, Flame, Search, Sparkles, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mascot } from '../../components/fun'
import { todayKey, useProgress } from '../../context/progress'
import { levelFor, usePhrasebook } from '../../context/phrasebook'
import { accentFor, catalog, catalogSorted, getCatalogLanguage, regions, type Region } from '../../data/phrasebook/catalog'
import { languageProgress } from '../../data/phrasebook/progress'

const DAILY_GOAL = 50

function GoalRing({ value }: { value: number }) {
  const pct = Math.min(1, value / DAILY_GOAL)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-20 place-items-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/20" />
        <motion.circle
          cx="32" cy="32" r={r} fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-center text-xs leading-tight font-bold">
        {pct >= 1 ? '🎉' : `${value}`}
        <span className="block text-[10px] font-medium text-white/70">/{DAILY_GOAL} XP</span>
      </span>
    </div>
  )
}

export default function PhrasebookHome() {
  const { xp, streak, activity } = useProgress()
  const { heard, due, recent } = usePhrasebook()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<'All' | Region>('All')

  const lvl = levelFor(xp)
  const today = activity[todayKey()] ?? 0

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalogSorted.filter(
      (l) => (region === 'All' || l.region === region) && (!q || `${l.name} ${l.nativeName}`.toLowerCase().includes(q)),
    )
  }, [query, region])

  const recentLangs = recent.map(getCatalogLanguage).filter((l) => !!l)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500 p-6 text-white shadow-xl shadow-primary-600/20 sm:p-8"
      >
        <div className="absolute -top-16 -right-10 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
          <Mascot mood="cheer" size={110} className="hidden md:block" />
          <div>
            <p className="text-sm font-medium text-white/80">Phrasebook · {catalog.length} languages</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl">Speak your first real phrases today</h1>
            <p className="mt-2 max-w-xl text-white/85">
              Pick a language, pick a situation, listen and repeat. Then beat four tests to earn your stars. Pip will remind you of anything you missed.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur"><Sparkles className="size-4" /> Level {lvl.level}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur"><Zap className="size-4" /> {xp} XP</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur"><Flame className="size-4" /> {streak} day streak</span>
            </div>
            <div className="mt-3 max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <motion.div className="h-full rounded-full bg-amber-300" initial={{ width: 0 }} animate={{ width: `${(lvl.into / lvl.need) * 100}%` }} transition={{ duration: 0.9 }} />
              </div>
              <p className="mt-1 text-xs text-white/70">{lvl.need - lvl.into} XP to level {lvl.level + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:flex-col">
            <GoalRing value={today} />
            <span className="text-xs font-medium text-white/80">Daily goal</span>
          </div>
        </div>
      </motion.section>

      {/* Review + recent */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/review"
          className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <span className="text-4xl">{due.length ? '🧠' : '🌟'}</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {due.length ? `${due.length} phrase${due.length === 1 ? '' : 's'} to review` : 'Review queue is clear'}
            </p>
            <p className="text-sm text-amber-800/80 dark:text-amber-200/70">
              {due.length ? 'Quick refresh of phrases you missed. They come back less often as you nail them.' : 'Missed phrases from tests show up here at just the right time.'}
            </p>
          </div>
          <ArrowRight className="size-5 text-amber-700 transition group-hover:translate-x-1 dark:text-amber-300" />
        </Link>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Jump back in</p>
          {recentLangs.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentLangs.map((l) => (
                <Link key={l.id} to={`/phrasebook/${l.id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-primary-50 hover:text-primary-700 dark:bg-slate-800 dark:hover:bg-primary-600/20 dark:hover:text-primary-300">
                  <span className="text-lg">{l.flag}</span> {l.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Languages you open will appear here.</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${catalog.length} languages…`}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-600/10 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['All', ...regions] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                region === r ? 'bg-primary-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Language grid */}
      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((l, i) => {
            const p = languageProgress(l.id, heard)
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 16) * 0.02 }}>
                <Link
                  to={`/phrasebook/${l.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentFor(l.id)}`} />
                  <div className="flex items-center gap-3">
                    <motion.span whileHover={{ rotate: [0, -12, 12, 0] }} className="text-4xl">{l.flag}</motion.span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{l.name}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{l.nativeName}</p>
                    </div>
                    {l.featured && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 uppercase dark:bg-primary-600/15 dark:text-primary-300">7 topics</span>}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full bg-gradient-to-r ${accentFor(l.id)}`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">{p.done}/{p.total} phrases heard</p>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
          <Mascot mood="think" size={80} />
          <p className="mt-2 font-medium">No language matches “{query}”</p>
        </div>
      )}
    </div>
  )
}
