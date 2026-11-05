import { ArrowRight, Crown, Flame, Globe2, MessageCircleHeart, Sparkles, Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mascot } from '../components/fun'
import { Card, ProgressBar } from '../components/ui'
import { levelFor, usePhrasebook } from '../context/phrasebook'
import { dayKey, todayKey, useProgress } from '../context/progress'
import { languages, overallScore } from '../data/languages'
import { accentFor, catalog, catalogSorted, getCatalogLanguage, regions, type Region } from '../data/phrasebook/catalog'
import { languageProgress, nextSituation, phrasebookTotals } from '../data/phrasebook/progress'
import { situations } from '../data/phrasebook/phrases'
import { lastNDays } from '../lib/dates'

const DAILY_GOAL = 50

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Pops the big hero number into view */
function PopNumber({ to }: { to: number }) {
  return (
    <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>
      {to}
    </motion.span>
  )
}

export default function Dashboard() {
  const { xp, streak, activity } = useProgress()
  const { heard, stars, due, recent } = usePhrasebook()
  const [region, setRegion] = useState<'All' | Region>('All')

  const lvl = levelFor(xp)
  const today = activity[todayKey()] ?? 0

  // Languages the learner has touched: recently opened or with phrases heard
  const myLanguages = useMemo(() => {
    const ids = new Set(recent)
    for (const k of heard) ids.add(k.split(':')[0])
    return [...ids]
      .map(getCatalogLanguage)
      .filter((l) => !!l)
      .map((l) => ({ lang: l, progress: languageProgress(l.id, heard), next: nextSituation(l.id, heard, stars) }))
      .slice(0, 6)
  }, [recent, heard, stars])

  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0)
  const stats = [
    { label: 'Languages to learn', value: phrasebookTotals.languages, icon: Globe2, color: 'from-primary-600 to-emerald-500' },
    { label: 'Phrases heard', value: `${heard.length}/${phrasebookTotals.phrases}`, icon: MessageCircleHeart, color: 'from-sky-500 to-cyan-500' },
    { label: 'Day streak', value: streak, icon: Flame, color: 'from-orange-500 to-rose-500' },
    { label: `${xp} XP · ${totalStars} stars`, value: `Level ${lvl.level}`, icon: Zap, color: 'from-amber-500 to-yellow-400' },
  ]

  const week = lastNDays(7).map((d, i) => ({
    label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    xp: activity[dayKey(d)] ?? 0,
    today: i === 6,
  }))
  const maxXp = Math.max(100, ...week.map((d) => d.xp))

  const wall = catalogSorted.filter((l) => region === 'All' || l.region === region)
  const regionCount = (r: Region) => catalog.filter((l) => l.region === r).length

  return (
    <div className="space-y-6">
      {/* Hero: how many languages there are to learn */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500 p-6 text-white shadow-xl shadow-primary-600/20 sm:p-8"
      >
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-primary-300/20 blur-2xl" />
        {/* Drifting flags in the background */}
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block" aria-hidden>
          {catalog.slice(0, 14).map((l, i) => (
            <motion.span
              key={l.id}
              className="absolute text-3xl opacity-25"
              style={{ left: `${62 + ((i * 37) % 22)}%`, top: `${8 + ((i * 53) % 80)}%` }}
              animate={{ y: [0, -10, 0], rotate: [0, i % 2 ? 8 : -8, 0] }}
              transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
            >
              {l.flag}
            </motion.span>
          ))}
        </div>

        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium text-white/80">{greeting()}, Raian 👋</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
              <span className="text-amber-300"><PopNumber to={phrasebookTotals.languages} /></span> languages.
              <br className="hidden sm:block" /> One playful place to learn them.
            </h1>
            <p className="mt-3 max-w-2xl text-white/85">
              {phrasebookTotals.phrases} real-life phrases across {situations.length} situations, from your first “hello” to ordering dinner and catching a taxi.
              Listen, repeat, play the tests and collect stars.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/phrasebook" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 shadow-lg transition hover:-translate-y-0.5">
                Pick a language <ArrowRight className="size-4" />
              </Link>
              {due.length > 0 && (
                <Link to="/review" className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-lg transition hover:-translate-y-0.5">
                  🧠 Review {due.length} phrase{due.length === 1 ? '' : 's'}
                </Link>
              )}
            </div>
          </div>
          <div className="hidden flex-col items-center md:flex">
            <Mascot mood="cheer" size={130} />
            <span className="mt-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">Pip says: let's talk!</span>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} delay={0.05 * i} whileHover={{ y: -4 }} className="transition-shadow hover:shadow-lg">
            <div className={`mb-3 grid size-10 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md`}>
              <s.icon className="size-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* My languages */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{myLanguages.length ? 'Continue learning' : 'Start with a favourite'}</h2>
          <Link to="/phrasebook" className="text-sm font-medium text-primary-600 hover:text-primary-700">All languages</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(myLanguages.length
            ? myLanguages
            : catalog.filter((l) => l.featured).slice(0, 3).map((l) => ({ lang: l, progress: languageProgress(l.id, heard), next: nextSituation(l.id, heard, stars) }))
          ).map(({ lang, progress, next }, i) => (
            <Card key={lang.id} delay={0.1 + i * 0.05} whileHover={{ y: -4 }} className="group overflow-hidden p-0 transition-shadow hover:shadow-lg">
              <div className={`h-1.5 bg-gradient-to-r ${accentFor(lang.id)}`} />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{lang.flag}</span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{lang.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{progress.done} of {progress.total} phrases heard</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-primary-600 dark:text-primary-400">{progress.pct}%</span>
                </div>
                <div className="mt-4"><ProgressBar value={progress.pct} gradient={accentFor(lang.id)} /></div>
                <p className="mt-4 text-xs text-slate-400 uppercase">Up next</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{next.emoji} {next.title}</p>
                <Link to={`/phrasebook/${lang.id}/${next.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                  Let's go <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Every language, browsable */}
      <Card delay={0.15}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Sparkles className="size-5 text-primary-500" /> All {catalog.length} languages you can learn here
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tap a flag to jump in. ⭐ marks the five with every situation unlocked.</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {(['All', ...regions] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                region === r ? 'bg-primary-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {r} <span className="opacity-70">{r === 'All' ? catalog.length : regionCount(r)}</span>
            </button>
          ))}
        </div>
        <motion.div layout className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-9">
          <AnimatePresence mode="popLayout">
            {wall.map((l, i) => {
              const pct = languageProgress(l.id, heard).pct
              return (
                <motion.div
                  key={l.id}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ delay: Math.min(i, 30) * 0.012 }}
                >
                  <Link
                    to={`/phrasebook/${l.id}`}
                    title={`${l.name} · ${l.nativeName}`}
                    className="group relative flex flex-col items-center rounded-2xl p-2 text-center transition hover:bg-primary-50 dark:hover:bg-primary-600/10"
                  >
                    <motion.span whileHover={{ scale: 1.25, rotate: [0, -10, 10, 0] }} className="text-3xl sm:text-4xl">{l.flag}</motion.span>
                    <span className="mt-1 w-full truncate text-xs font-medium text-slate-700 dark:text-slate-200">{l.name.replace(' (Mandarin)', '')}</span>
                    {l.featured && <span className="absolute top-1 right-1 text-[10px]">⭐</span>}
                    {pct > 0 && (
                      <span className="mt-1 h-1 w-10 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <span className="block h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </span>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Weekly activity + daily goal */}
        <Card delay={0.2} className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">This week</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">XP earned per day</p>
            </div>
            <div className="min-w-48 rounded-2xl bg-amber-50 px-4 py-2.5 dark:bg-amber-500/10">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Today's goal {today >= DAILY_GOAL ? '🎉' : ''}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-500/20">
                  <motion.div className="h-full rounded-full bg-amber-500" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (today / DAILY_GOAL) * 100)}%` }} />
                </div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{Math.min(today, DAILY_GOAL)}/{DAILY_GOAL}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end justify-between gap-2">
            {week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end">
                  <motion.div
                    title={`${d.xp} XP`}
                    className={`w-full rounded-t-lg ${d.today ? 'bg-gradient-to-t from-primary-600 to-primary-400' : 'bg-primary-200 dark:bg-primary-600/30'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, (d.xp / maxXp) * 100)}%` }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                  />
                </div>
                <span className={`text-xs ${d.today ? 'font-semibold text-primary-600' : 'text-slate-400'}`}>{d.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">{week.reduce((s, d) => s + d.xp, 0)} XP</span> in the last 7 days ·{' '}
            {lvl.need - lvl.into} XP to level {lvl.level + 1}
          </p>
        </Card>

        {/* Career languages, compact */}
        <Card delay={0.25}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Best for your career</h2>
            <Link to="/languages" className="text-sm font-medium text-primary-600 hover:text-primary-700">Courses</Link>
          </div>
          <ul className="space-y-3">
            {languages.map((l, i) => (
              <li key={l.id}>
                <Link to={`/languages/${l.id}`} className="group flex items-center gap-3">
                  <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {i === 0 ? <Crown className="size-3.5" /> : l.rank}
                  </span>
                  <span className="text-xl">{l.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate font-medium text-slate-800 group-hover:text-primary-600 dark:text-slate-100">{l.name}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{overallScore(l.scores)}</span>
                    </div>
                    <ProgressBar value={overallScore(l.scores)} gradient={l.gradient} delay={0.3 + i * 0.05} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">Ranked by economic value. <Link to="/about" className="underline">Why these 5?</Link></p>
        </Card>
      </div>
    </div>
  )
}
