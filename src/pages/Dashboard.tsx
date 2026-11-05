import { ArrowRight, BookOpenCheck, Crown, Flame, Globe2, TrendingUp, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Card, ProgressBar } from '../components/ui'
import { dayKey, useProgress } from '../context/progress'
import { languages, overallScore, scoreLabels, totalLessons, type ValueScores } from '../data/languages'
import { lastNDays } from '../lib/dates'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { xp, streak, completedLessons, activity } = useProgress()

  const stats = [
    { label: 'Total XP', value: xp, icon: Zap, color: 'from-primary-600 to-primary-500' },
    { label: 'Day streak', value: streak, icon: Flame, color: 'from-orange-500 to-rose-500' },
    { label: 'Lessons done', value: `${completedLessons.length}/${totalLessons}`, icon: BookOpenCheck, color: 'from-emerald-500 to-teal-500' },
    { label: 'Languages', value: languages.length, icon: Globe2, color: 'from-sky-500 to-cyan-500' },
  ]

  // Last 7 days of XP
  const week = lastNDays(7).map((d, i) => ({
    label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    xp: activity[dayKey(d)] ?? 0,
    today: i === 6,
  }))
  const maxXp = Math.max(100, ...week.map((d) => d.xp))

  const inProgress = languages
    .map((l) => {
      const done = l.lessons.filter((x) => completedLessons.includes(x.id)).length
      const next = l.lessons.find((x) => !completedLessons.includes(x.id))
      return { lang: l, done, next, pct: Math.round((done / l.lessons.length) * 100) }
    })
    .sort((a, b) => b.done - a.done)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 p-6 text-white shadow-xl shadow-primary-600/20 sm:p-8"
      >
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-primary-300/20 blur-2xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium text-white/80">{greeting()}, Raian 👋</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
              Which language actually makes you the most money?
            </h1>
            <p className="mt-3 max-w-2xl text-white/80">
              Not the one with the most speakers. Learn the five languages ranked by GDP access, trade utility,
              diplomatic weight and real wage premiums.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/practice" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 shadow-lg transition hover:-translate-y-0.5">
                Continue learning <ArrowRight className="size-4" />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25">
                See the ranking
              </Link>
            </div>
          </div>
          <div className="hidden gap-2 md:flex">
            {languages.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{ opacity: { delay: 0.2 + i * 0.08 }, y: { duration: 3, repeat: Infinity, delay: i * 0.3 } }}
                className="grid size-14 place-items-center rounded-2xl bg-white/15 text-3xl backdrop-blur"
              >
                {l.flag}
              </motion.div>
            ))}
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

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Money ranking */}
        <Card delay={0.15} className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <TrendingUp className="size-5 text-emerald-500" /> Most valuable languages
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Overall economic value score</p>
            </div>
            <Link to="/languages" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <ul className="space-y-4">
            {languages.map((l, i) => {
              const score = overallScore(l.scores)
              return (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                >
                  <Link to={`/languages/${l.id}`} className="group flex items-center gap-4">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {i === 0 ? <Crown className="size-4" /> : l.rank}
                    </span>
                    <span className="text-2xl">{l.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium text-slate-800 group-hover:text-primary-600 dark:text-slate-100">{l.name}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{score}</span>
                      </div>
                      <ProgressBar value={score} gradient={l.gradient} delay={0.3 + i * 0.07} />
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{l.tagline}</p>
                    </div>
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </Card>

        {/* Weekly activity */}
        <Card delay={0.2}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">This week</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">XP earned per day</p>
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
            <span className="font-semibold text-slate-900 dark:text-white">{week.reduce((s, d) => s + d.xp, 0)} XP</span> in the last 7 days
          </p>
        </Card>
      </div>

      {/* Continue learning */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Continue learning</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {inProgress.slice(0, 3).map(({ lang, done, next, pct }, i) => (
            <Card key={lang.id} delay={0.25 + i * 0.05} whileHover={{ y: -4 }} className="group overflow-hidden p-0 transition-shadow hover:shadow-lg">
              <div className={`h-1.5 bg-gradient-to-r ${lang.gradient}`} />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{lang.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{done} of {lang.lessons.length} lessons</p>
                  </div>
                  <span className={`ml-auto text-sm font-bold ${lang.accentText}`}>{pct}%</span>
                </div>
                <div className="mt-4"><ProgressBar value={pct} gradient={lang.gradient} /></div>
                <p className="mt-4 text-xs text-slate-400 uppercase">Up next</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{next?.title ?? 'All lessons complete 🎉'}</p>
                <Link to={`/languages/${lang.id}`} className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${lang.accentText}`}>
                  Open course <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Compare dimensions */}
      <Card delay={0.3}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How they compare</h2>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Score breakdown by economic dimension (0–100)</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(scoreLabels) as (keyof ValueScores)[]).map((key, ki) => {
            const best = [...languages].sort((a, b) => b.scores[key] - a.scores[key])
            return (
              <div key={key}>
                <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{scoreLabels[key]}</p>
                <ul className="space-y-2.5">
                  {best.map((l, i) => (
                    <li key={l.id} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-base">{l.flag}</span>
                      <div className="flex-1"><ProgressBar value={l.scores[key]} gradient={l.gradient} delay={0.4 + ki * 0.1 + i * 0.04} /></div>
                      <span className="w-6 text-right font-medium text-slate-600 dark:text-slate-300">{l.scores[key]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
