import { ArrowLeft, Bookmark, BookmarkCheck, CheckCircle2, Circle, Clock, Sparkles, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, LevelBadge, ProgressBar } from '../components/ui'
import { speak } from '../lib/speech'
import { useProgress } from '../context/progress'
import { getLanguage, overallScore, scoreLabels, type Level, type ValueScores } from '../data/languages'
import NotFound from './NotFound'

const levels: ('All' | Level)[] = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function LanguageDetail() {
  const { id } = useParams()
  const lang = getLanguage(id)
  const { completedLessons, toggleLesson, bookmarks, toggleBookmark } = useProgress()
  const [level, setLevel] = useState<'All' | Level>('All')

  if (!lang) return <NotFound />

  const done = lang.lessons.filter((l) => completedLessons.includes(l.id)).length
  const pct = Math.round((done / lang.lessons.length) * 100)
  const lessons = lang.lessons.filter((l) => level === 'All' || l.level === level)

  return (
    <div className="space-y-6">
      <Link to="/languages" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
        <ArrowLeft className="size-4" /> All languages
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${lang.gradient} p-6 text-white shadow-xl sm:p-8`}
      >
        <div className="absolute -top-10 -right-10 text-[10rem] leading-none opacity-20 select-none">{lang.flag}</div>
        <div className="relative">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">Rank #{lang.rank} most valuable</span>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{lang.flag} {lang.name}</h1>
          <p className="mt-1 text-white/80">{lang.nativeName} · {lang.speakers} speakers · {lang.studyHours} to learn</p>
          <p className="mt-4 max-w-2xl text-white/90">{lang.whyValuable}</p>
          <div className="mt-6 max-w-sm">
            <div className="mb-1 flex justify-between text-sm"><span>Your progress</span><span className="font-semibold">{pct}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lessons */}
        <Card delay={0.1} className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Learning path</h2>
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`relative rounded-lg px-3 py-1 text-xs font-medium transition ${level === l ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                  {level === l && <motion.span layoutId="level-pill" className="absolute inset-0 rounded-lg bg-white shadow dark:bg-slate-700" />}
                  <span className="relative">{l}</span>
                </button>
              ))}
            </div>
          </div>
          <motion.ul layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {lessons.map((lesson) => {
                const isDone = completedLessons.includes(lesson.id)
                const isSaved = bookmarks.includes(lesson.id)
                return (
                  <motion.li
                    key={lesson.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition ${isDone ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'}`}
                  >
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleLesson(lesson.id)} aria-label={isDone ? 'Mark as not done' : 'Mark as done'}>
                      {isDone ? <CheckCircle2 className="size-6 text-emerald-500" /> : <Circle className="size-6 text-slate-300 dark:text-slate-600" />}
                    </motion.button>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${isDone ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{lesson.title}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{lesson.description}</p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      <LevelBadge level={lesson.level} />
                      <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="size-3.5" />{lesson.minutes}m</span>
                    </div>
                    <button onClick={() => toggleBookmark(lesson.id)} aria-label="Bookmark lesson" className="text-slate-400 hover:text-primary-600">
                      {isSaved ? <BookmarkCheck className="size-5 text-primary-600" /> : <Bookmark className="size-5" />}
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </motion.ul>
          <p className="mt-4 text-xs text-slate-400">Tick a lesson to mark it complete and earn 50 XP.</p>
        </Card>

        <div className="space-y-6">
          <Card delay={0.15}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Why it pays</h2>
            <ul className="space-y-3">
              {lang.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Sparkles className={`mt-0.5 size-4 shrink-0 ${lang.accentText}`} /> {h}
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              {(Object.keys(scoreLabels) as (keyof ValueScores)[]).map((k, i) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{scoreLabels[k]}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{lang.scores[k]}</span>
                  </div>
                  <ProgressBar value={lang.scores[k]} gradient={lang.gradient} delay={0.2 + i * 0.08} />
                </div>
              ))}
              <p className="pt-1 text-sm text-slate-600 dark:text-slate-300">Overall: <span className="font-bold">{overallScore(lang.scores)}/100</span></p>
            </div>
          </Card>

          <Card delay={0.2}>
            <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Key phrases</h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Tap the speaker to hear the pronunciation.</p>
            <ul className="space-y-2">
              {lang.phrases.map((p) => (
                <li key={p.text} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{p.text} {p.romanization && <span className="text-xs font-normal text-slate-400">({p.romanization})</span>}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.meaning}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => speak(p.text, lang.speechCode)} className={`rounded-lg p-2 text-white ${lang.accentBg}`} aria-label={`Hear ${p.text}`}>
                    <Volume2 className="size-4" />
                  </motion.button>
                </li>
              ))}
            </ul>
            <Link to={`/practice?lang=${lang.id}`} className={`mt-4 block rounded-xl bg-gradient-to-r ${lang.gradient} py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:opacity-90`}>
              Practice these phrases
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
