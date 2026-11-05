import { ArrowLeft, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Stars } from '../../components/fun'
import { usePhrasebook } from '../../context/phrasebook'
import { getCatalogLanguage } from '../../data/phrasebook/catalog'
import { getSituation, phrasesFor } from '../../data/phrasebook/phrases'
import { situationProgress } from '../../data/phrasebook/progress'
import NotFound from '../NotFound'
import PhrasePlayer from './PhrasePlayer'
import TestRunner from './TestRunner'
import { tests } from '../../data/phrasebook/tests'

export default function SituationPage() {
  const { langId, situationId } = useParams()
  const lang = getCatalogLanguage(langId)
  const situation = getSituation(situationId)
  const [params, setParams] = useSearchParams()
  const { heard, stars } = usePhrasebook()
  const phrases = useMemo(() => (lang && situation ? phrasesFor(lang.id, situation.id) : []), [lang, situation])

  if (!lang || !situation || !phrases.length) return <NotFound />

  const progress = situationProgress(lang.id, situation.id, heard, stars)
  const unlocked = (n: number) => n === 1 || progress.testStars[n - 2] >= 1
  const requested = Number(params.get('test')) || 0
  const activeTest = requested >= 1 && requested <= tests.length && unlocked(requested) ? requested : 0
  const openTest = (n: number) => setParams(n ? { test: String(n) } : {})

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/phrasebook/${lang.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
          <ArrowLeft className="size-4" /> {lang.flag} {lang.name}
        </Link>
        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">⭐ {progress.stars}/{progress.maxStars}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${situation.gradient} text-2xl shadow-md`}>{situation.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{situation.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{situation.blurb}</p>
        </div>
      </div>

      {/* Learning path: listen first, then four escalating tests */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <PathStep active={activeTest === 0} onClick={() => openTest(0)} emoji="🎧" title="Learn" sub={`${progress.heard}/${progress.total} heard`} />
        {tests.map((t) => (
          <PathStep
            key={t.n}
            active={activeTest === t.n}
            locked={!unlocked(t.n)}
            onClick={() => unlocked(t.n) && openTest(t.n)}
            emoji={t.emoji}
            title={`${t.n}. ${t.title}`}
            sub={<Stars value={progress.testStars[t.n - 1]} size="text-xs" />}
          />
        ))}
      </div>

      {activeTest === 0 ? (
        <PhrasePlayer lang={lang} situation={situation} phrases={phrases} onStartTests={() => openTest(1)} />
      ) : (
        <TestRunner
          lang={lang}
          situation={situation}
          phrases={phrases}
          test={activeTest}
          onExit={() => openTest(0)}
          onNextTest={() => openTest(activeTest + 1)}
        />
      )}
    </div>
  )
}

function PathStep({
  active, locked, onClick, emoji, title, sub,
}: {
  active: boolean
  locked?: boolean
  onClick: () => void
  emoji: string
  title: string
  sub: ReactNode
}) {
  return (
    <motion.button
      whileHover={!locked ? { y: -2 } : undefined}
      whileTap={!locked ? { scale: 0.96 } : undefined}
      onClick={onClick}
      title={locked ? 'Earn a star in the previous test to unlock' : undefined}
      className={`relative flex shrink-0 items-center gap-2.5 rounded-2xl border-2 px-3.5 py-2 text-left transition ${
        active ? 'border-primary-500 bg-primary-50 dark:bg-primary-600/15'
        : locked ? 'cursor-not-allowed border-slate-200 opacity-50 dark:border-slate-800'
        : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <span className="text-2xl">{locked ? <Lock className="size-5 text-slate-400" /> : emoji}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{sub}</span>
      </span>
    </motion.button>
  )
}
