import { ArrowLeft, Lock, TrendingUp, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Mascot, Stars } from '../../components/fun'
import { usePhrasebook } from '../../context/phrasebook'
import { accentFor, getCatalogLanguage } from '../../data/phrasebook/catalog'
import { situationsFor } from '../../data/phrasebook/phrases'
import { languageProgress, situationProgress } from '../../data/phrasebook/progress'
import { useHasVoice } from '../../lib/speech'
import NotFound from '../NotFound'

export default function LanguageHub() {
  const { langId } = useParams()
  const lang = getCatalogLanguage(langId)
  const { heard, stars, due, visitLanguage } = usePhrasebook()
  const hasVoice = useHasVoice(lang?.speechCode ?? 'en')

  useEffect(() => {
    if (lang) visitLanguage(lang.id)
  }, [lang, visitLanguage])

  if (!lang) return <NotFound />

  const sits = situationsFor(lang.id)
  const progress = languageProgress(lang.id, heard)
  const dueHere = due.filter((k) => k.startsWith(`${lang.id}:`)).length

  return (
    <div className="space-y-6">
      <Link to="/phrasebook" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
        <ArrowLeft className="size-4" /> All languages
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${accentFor(lang.id)} p-6 text-white shadow-xl sm:p-8`}
      >
        <motion.div
          className="absolute -top-6 -right-4 text-[9rem] leading-none opacity-25 select-none"
          animate={{ rotate: [0, 6, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          {lang.flag}
        </motion.div>
        <div className="relative">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{lang.region}</span>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{lang.flag} {lang.name}</h1>
          <p className="mt-1 text-white/85">{lang.nativeName}</p>
          <div className="mt-5 max-w-sm">
            <div className="mb-1 flex justify-between text-sm"><span>Phrases heard</span><span className="font-semibold">{progress.done}/{progress.total}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {dueHere > 0 && (
              <Link to={`/review?lang=${lang.id}`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white/90">
                🧠 Review {dueHere} phrase{dueHere === 1 ? '' : 's'}
              </Link>
            )}
            {lang.featured && (
              <Link to={`/languages/${lang.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30">
                <TrendingUp className="size-4" /> Career course
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {(hasVoice === false || lang.community) && (
        <div className="flex flex-col gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          {hasVoice === false && (
            <p className="flex items-start gap-2">
              <VolumeX className="mt-0.5 size-4 shrink-0" />
              This device has no {lang.name} voice, so pronunciation may be off. For the best audio use Chrome or Edge, or add a {lang.name} voice in your system's speech settings.
            </p>
          )}
          {lang.community && (
            <p>🌱 {lang.name} is a regional language. Phrases here are a best-effort starter set and spelling can vary from village to village.</p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Pick a situation</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sits.map((s, i) => {
            const p = situationProgress(lang.id, s.id, heard, stars)
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={s.available ? { y: -4 } : undefined}
                className={`relative h-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${s.available ? 'hover:shadow-lg' : 'opacity-60'}`}
              >
                <div className={`absolute -top-8 -right-8 size-28 rounded-full bg-gradient-to-br ${s.gradient} opacity-20`} />
                <div className="relative flex items-start gap-4">
                  <motion.span
                    className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${s.gradient} text-3xl shadow-md`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.08 }}
                  >
                    {s.emoji}
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{s.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{s.blurb}</p>
                  </div>
                </div>
                {s.available ? (
                  <div className="relative mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{p.heard}/{p.total} heard</span>
                    <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                      <Stars value={Math.round((p.stars / p.maxStars) * 3)} size="text-sm" /> {p.stars}/{p.maxStars}
                    </span>
                  </div>
                ) : (
                  <p className="relative mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500"><Lock className="size-3.5" /> Coming soon in {lang.name}</p>
                )}
              </motion.div>
            )
            return s.available ? (
              <Link key={s.id} to={`/phrasebook/${lang.id}/${s.id}`}>{card}</Link>
            ) : (
              <div key={s.id}>{card}</div>
            )
          })}
        </div>
      </div>

      {!lang.featured && (
        <div className="flex items-center gap-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
          <Mascot mood="happy" size={56} />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Restaurant, taxi, hotel, shopping and directions are unlocked in English, Spanish, French, Mandarin and German. More {lang.name} situations are on the way.
          </p>
        </div>
      )}
    </div>
  )
}
