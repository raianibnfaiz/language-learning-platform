import { Award, Flame, Medal, Star, Target, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { Card, PageHeader, ProgressBar } from '../components/ui'
import { dayKey, useProgress } from '../context/progress'
import { languages, totalLessons } from '../data/languages'
import { lastNDays } from '../lib/dates'

export default function Progress() {
  const { xp, streak, completedLessons, activity, reset } = useProgress()
  const level = Math.floor(xp / 250) + 1
  const levelPct = ((xp % 250) / 250) * 100

  const achievements = [
    { title: 'First steps', desc: 'Complete your first lesson', icon: Star, earned: completedLessons.length >= 1 },
    { title: 'On fire', desc: 'Reach a 3 day streak', icon: Flame, earned: streak >= 3 },
    { title: 'Polyglot', desc: 'Start all 5 languages', icon: Medal, earned: languages.every((l) => l.lessons.some((x) => completedLessons.includes(x.id))) },
    { title: 'XP hunter', desc: 'Earn 500 XP', icon: Zap, earned: xp >= 500 },
    { title: 'Half way', desc: `Finish ${Math.ceil(totalLessons / 2)} lessons`, icon: Target, earned: completedLessons.length >= totalLessons / 2 },
    { title: 'Money talks', desc: 'Finish every English lesson', icon: Award, earned: languages[0].lessons.every((x) => completedLessons.includes(x.id)) },
  ]

  // 12-week heatmap
  const days = lastNDays(84).map((d) => activity[dayKey(d)] ?? 0)
  const heat = (v: number) =>
    v === 0 ? 'bg-slate-100 dark:bg-slate-800' : v < 40 ? 'bg-primary-200 dark:bg-primary-900' : v < 80 ? 'bg-primary-400 dark:bg-primary-700' : 'bg-primary-700 dark:bg-primary-400'

  return (
    <>
      <PageHeader title="Your progress" subtitle="Track lessons, XP and achievements across all five languages.">
        <button onClick={reset} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800">
          Reset demo data
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="relative size-36">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="42" className="fill-none stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                className="stroke-primary-600"
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - levelPct / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{level}</p>
                <p className="text-xs text-slate-500">Level</p>
              </div>
            </div>
          </div>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">{xp} XP total</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{250 - (xp % 250)} XP to level {level + 1}</p>
        </Card>

        <Card delay={0.05} className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">By language</h2>
          <ul className="space-y-4">
            {languages.map((l, i) => {
              const done = l.lessons.filter((x) => completedLessons.includes(x.id)).length
              return (
                <li key={l.id} className="flex items-center gap-3">
                  <span className="text-2xl">{l.flag}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{l.name}</span>
                      <span className="text-slate-500">{done}/{l.lessons.length}</span>
                    </div>
                    <ProgressBar value={(done / l.lessons.length) * 100} gradient={l.gradient} delay={0.1 + i * 0.06} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <Card delay={0.1} className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Activity (last 12 weeks)</h2>
        <div className="grid grid-flow-col grid-rows-7 justify-start gap-1">
          {days.map((v, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.004 }} title={`${v} XP`} className={`size-3.5 rounded-sm sm:size-4 ${heat(v)}`} />
          ))}
        </div>
      </Card>

      <h2 className="mt-8 mb-4 text-lg font-semibold text-slate-900 dark:text-white">Achievements</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <Card key={a.title} delay={0.15 + i * 0.05} whileHover={{ scale: 1.02 }} className={a.earned ? '' : 'opacity-50 grayscale'}>
            <div className="flex items-center gap-4">
              <div className={`grid size-12 place-items-center rounded-2xl ${a.earned ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                <a.icon className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{a.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
