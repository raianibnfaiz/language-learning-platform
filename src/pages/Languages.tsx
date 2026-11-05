import { ArrowRight, Clock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, LevelBadge, PageHeader, ProgressBar } from '../components/ui'
import { useProgress } from '../context/progress'
import { languages, overallScore } from '../data/languages'

export default function Languages() {
  const { completedLessons } = useProgress()

  return (
    <>
      <PageHeader title="Explore languages" subtitle="Five languages, ranked by how much opportunity they unlock." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {languages.map((l, i) => {
          const done = l.lessons.filter((x) => completedLessons.includes(x.id)).length
          return (
            <Card key={l.id} delay={i * 0.06} whileHover={{ y: -6 }} className="group relative overflow-hidden p-0 transition-shadow hover:shadow-xl">
              <div className={`relative bg-gradient-to-br ${l.gradient} p-5 text-white`}>
                <span className="absolute top-4 right-4 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur">#{l.rank}</span>
                <span className="text-5xl">{l.flag}</span>
                <h2 className="mt-3 text-xl font-bold">{l.name}</h2>
                <p className="text-sm text-white/80">{l.nativeName}</p>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-sm text-slate-600 dark:text-slate-300">{l.tagline}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users className="size-3.5" /> {l.speakers} speakers</span>
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {l.studyHours}</span>
                  <LevelBadge level={l.difficulty} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Value score</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{overallScore(l.scores)}/100</span>
                  </div>
                  <ProgressBar value={overallScore(l.scores)} gradient={l.gradient} delay={0.2 + i * 0.06} />
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{done}/{l.lessons.length} lessons done</span>
                  <Link to={`/languages/${l.id}`} className={`flex items-center gap-1 text-sm font-semibold ${l.accentText}`}>
                    Start <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
