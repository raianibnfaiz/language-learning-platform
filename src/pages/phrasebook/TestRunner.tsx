import { ArrowRight, Delete, RotateCcw, Volume2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Confetti, Mascot, Stars, XpPop } from '../../components/fun'
import { randomCheer, randomNudge } from '../../lib/cheers'
import { tests } from '../../data/phrasebook/tests'
import { useProgress } from '../../context/progress'
import { phraseKey, starsFor, usePhrasebook } from '../../context/phrasebook'
import type { CatalogLanguage } from '../../data/phrasebook/catalog'
import type { LearnPhrase, Situation } from '../../data/phrasebook/phrases'
import { speak, RATE_NORMAL, RATE_SLOW } from '../../lib/speech'
import { graphemes, normalize, sample, shuffle, words } from '../../lib/text'


const COMBO_EVERY = 3
const COMBO_BONUS = 5

interface Tile {
  id: number
  text: string
}

interface Question {
  phrase: LearnPhrase
  options: LearnPhrase[]
  /** Word builder: pieces in the right order */
  pieces: string[]
  /** Fill the gap */
  gap: { before: string; word: string; after: string }
}

function buildQuestions(phrases: LearnPhrase[], locale: string): Question[] {
  return shuffle(phrases).map((phrase) => {
    const ws = words(phrase.text, locale)
    const pieces = ws.length >= 2 ? ws : graphemes(phrase.text.replace(/[\p{P}\s]/gu, ''), locale)
    const word = ws.length ? [...ws].sort((a, b) => b.length - a.length)[0] : phrase.text
    const at = phrase.text.indexOf(word)
    return {
      phrase,
      options: shuffle([phrase, ...sample(phrases, 3, phrase)]),
      pieces,
      gap: { before: phrase.text.slice(0, at), word, after: phrase.text.slice(at + word.length) },
    }
  })
}

interface Props {
  lang: CatalogLanguage
  situation: Situation
  phrases: LearnPhrase[]
  test: number
  onExit: () => void
  onNextTest: () => void
}

export default function TestRunner(props: Props) {
  // Re-mount the run for each attempt so every question state resets cleanly
  const [attempt, setAttempt] = useState(0)
  return <Run key={`${props.test}-${attempt}`} {...props} onRetry={() => setAttempt((a) => a + 1)} />
}

function Run({ lang, situation, phrases, test, onExit, onNextTest, onRetry }: Props & { onRetry: () => void }) {
  const meta = tests[test - 1]
  const { addXp } = useProgress()
  const { recordTest } = usePhrasebook()
  const questions = useMemo(() => buildQuestions(phrases, lang.speechCode), [phrases, lang.speechCode])

  const [index, setIndex] = useState(0)
  const [verdict, setVerdict] = useState<null | { right: boolean; note?: string }>(null)
  const [correct, setCorrect] = useState(0)
  const [combo, setCombo] = useState(0)
  const [earned, setEarned] = useState(0)
  const [missed, setMissed] = useState<LearnPhrase[]>([])
  const [pop, setPop] = useState({ id: 0, amount: 0 })
  const [finished, setFinished] = useState(false)

  const q = questions[index]
  const say = (rate = RATE_NORMAL) => speak(q.phrase.text, lang.speechCode, rate)
  const isEnglish = lang.id === 'english'

  // Listening tests read the phrase out as soon as the question appears
  useEffect(() => {
    if (!finished && (test === 1 || test === 2)) speak(questions[index].phrase.text, lang.speechCode, RATE_NORMAL)
  }, [index, test, finished, questions, lang.speechCode])

  const answer = (right: boolean, note?: string) => {
    if (verdict) return
    setVerdict({ right, note })
    if (right) {
      const nextCombo = combo + 1
      const gain = meta.xp + (nextCombo % COMBO_EVERY === 0 ? COMBO_BONUS : 0)
      setCorrect((c) => c + 1)
      setCombo(nextCombo)
      setEarned((e) => e + gain)
      addXp(gain)
      setPop((p) => ({ id: p.id + 1, amount: gain }))
      if (test > 2) say()
    } else {
      setCombo(0)
      setMissed((m) => [...m, q.phrase])
      say()
    }
  }

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setVerdict(null)
      return
    }
    const stars = starsFor(correct, questions.length)
    recordTest(lang.id, situation.id, test, stars, missed.map((p) => phraseKey(lang.id, p.id)))
    setFinished(true)
  }

  // Enter continues after an answer
  const nextRef = useRef(next)
  useEffect(() => {
    nextRef.current = next
  })
  useEffect(() => {
    if (!verdict) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        nextRef.current()
      }
    }
    // Let the Enter that submitted the answer finish first
    const t = window.setTimeout(() => window.addEventListener('keydown', onKey), 50)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [verdict])

  if (finished) {
    const stars = starsFor(correct, questions.length)
    return (
      <Results
        stars={stars}
        correct={correct}
        total={questions.length}
        earned={earned}
        missed={missed}
        lang={lang}
        test={test}
        onRetry={onRetry}
        onExit={onExit}
        onNextTest={onNextTest}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onExit} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Leave test">
          <X className="size-5" />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${situation.gradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${((index + (verdict ? 1 : 0)) / questions.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>
        <AnimatePresence>
          {combo >= 2 && (
            <motion.span key={combo} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="rounded-full bg-orange-100 px-2.5 py-1 text-sm font-bold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
              🔥 {combo}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="relative rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <XpPop id={pop.id} amount={pop.amount} />
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {meta.emoji} Test {test} · {meta.title} · {index + 1}/{questions.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
            {test === 1 && <PictureMatch q={q} verdict={verdict} onAnswer={answer} onListen={say} />}
            {test === 2 && <SharpEars q={q} verdict={verdict} onAnswer={answer} onListen={say} />}
            {test === 3 && <WordBuilder q={q} verdict={verdict} onAnswer={answer} onListen={say} showMeaning={!isEnglish} />}
            {test === 4 && <FillGap q={q} verdict={verdict} onAnswer={answer} onListen={say} latin={lang.latin} locale={lang.speechCode} showMeaning={!isEnglish} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {verdict && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className={`mt-4 flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center ${verdict.right ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-rose-100 dark:bg-rose-500/15'}`}
          >
            <Mascot size={64} mood={verdict.right ? 'cheer' : 'oops'} />
            <div className="flex-1">
              <p className={`text-lg font-bold ${verdict.right ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {verdict.right ? (combo > 0 && combo % COMBO_EVERY === 0 ? `Combo x${combo}! +${COMBO_BONUS} bonus` : randomCheer()) : randomNudge()}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200" dir="auto">
                <span className="font-semibold">{q.phrase.text}</span>
                {q.phrase.romanization && <span className="italic"> · {q.phrase.romanization}</span>} · {q.phrase.meaning}
              </p>
              {verdict.note && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{verdict.note}</p>}
              {!verdict.right && <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">Added to your review queue.</p>}
            </div>
            <button onClick={next} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold text-white shadow-md ${verdict.right ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
              Continue <ArrowRight className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Question types ---------- */

interface QProps {
  q: Question
  verdict: null | { right: boolean }
  onAnswer: (right: boolean, note?: string) => void
  onListen: (rate?: number) => void
}

function ListenButtons({ onListen, big = false }: { onListen: (rate?: number) => void; big?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => onListen()}
        className={`grid place-items-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 ${big ? 'size-20' : 'size-12'}`}
        aria-label="Listen"
      >
        <Volume2 className={big ? 'size-9' : 'size-5'} />
      </motion.button>
      <button onClick={() => onListen(RATE_SLOW)} className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        🐢 Slower
      </button>
    </div>
  )
}

function OptionButton({ state, onClick, children, className = '' }: { state: 'idle' | 'right' | 'wrong' | 'dim'; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button
      whileHover={state === 'idle' ? { scale: 1.03 } : undefined}
      whileTap={state === 'idle' ? { scale: 0.96 } : undefined}
      animate={state === 'wrong' ? { x: [0, -10, 10, -6, 6, 0] } : state === 'right' ? { scale: [1, 1.08, 1] } : {}}
      onClick={onClick}
      className={`rounded-2xl border-2 border-b-4 transition-colors ${
        state === 'right' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15'
        : state === 'wrong' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/15'
        : state === 'dim' ? 'border-slate-200 opacity-40 dark:border-slate-700'
        : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 dark:border-slate-700 dark:hover:bg-primary-600/10'
      } ${className}`}
    >
      {children}
    </motion.button>
  )
}

function useChoice(q: Question, verdict: QProps['verdict'], onAnswer: QProps['onAnswer']) {
  const [picked, setPicked] = useState<string | null>(null)
  const stateOf = (id: string) => {
    if (!verdict) return 'idle' as const
    if (id === q.phrase.id) return 'right' as const
    return id === picked ? ('wrong' as const) : ('dim' as const)
  }
  const pick = (id: string) => {
    if (verdict) return
    setPicked(id)
    onAnswer(id === q.phrase.id)
  }
  return { stateOf, pick }
}

function PictureMatch({ q, verdict, onAnswer, onListen }: QProps) {
  const { stateOf, pick } = useChoice(q, verdict, onAnswer)
  return (
    <div className="mt-6 space-y-6">
      <p className="text-center text-xl font-bold text-slate-900 dark:text-white">What did you hear?</p>
      <ListenButtons onListen={onListen} big />
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((o) => (
          <OptionButton key={o.id} state={stateOf(o.id)} onClick={() => pick(o.id)} className="grid aspect-[4/3] place-items-center">
            <span className="text-6xl sm:text-7xl">{o.picture}</span>
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function SharpEars({ q, verdict, onAnswer, onListen }: QProps) {
  const { stateOf, pick } = useChoice(q, verdict, onAnswer)
  return (
    <div className="mt-6 space-y-6">
      <p className="text-center text-xl font-bold text-slate-900 dark:text-white">Which phrase did you hear?</p>
      <ListenButtons onListen={onListen} big />
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o) => (
          <OptionButton key={o.id} state={stateOf(o.id)} onClick={() => pick(o.id)} className="p-4 text-left">
            <span className="block text-lg font-semibold text-slate-900 dark:text-white" dir="auto">{o.text}</span>
            {o.romanization && <span className="block text-sm text-slate-500 italic">{o.romanization}</span>}
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function Prompt({ q, showMeaning, label }: { q: Question; showMeaning: boolean; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <motion.span initial={{ rotate: -15, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring' }} className="text-6xl">
        {q.phrase.picture}
      </motion.span>
      <div>
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{showMeaning ? label : 'Match this picture'}</p>
        {showMeaning && <p className="text-2xl font-bold text-slate-900 dark:text-white">“{q.phrase.meaning}”</p>}
      </div>
    </div>
  )
}

function TileButton({ text, onClick, disabled }: { text: string; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      layout
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border-2 border-b-4 border-slate-200 bg-white px-3.5 py-2 text-lg font-semibold text-slate-800 hover:border-primary-400 disabled:cursor-default dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      {text}
    </motion.button>
  )
}

function WordBuilder({ q, verdict, onAnswer, onListen, showMeaning }: QProps & { showMeaning: boolean }) {
  const pool = useMemo<Tile[]>(() => {
    const tiles = q.pieces.map((text, id) => ({ id, text }))
    let mixed = shuffle(tiles)
    // Make sure the shuffled order is not already the answer
    for (let i = 0; i < 5 && tiles.length > 1 && mixed.every((t, j) => t.text === q.pieces[j]); i++) mixed = shuffle(tiles)
    return mixed
  }, [q])
  const [placed, setPlaced] = useState<number[]>([])

  const place = (id: number) => {
    if (verdict) return
    const nextPlaced = [...placed, id]
    setPlaced(nextPlaced)
    if (nextPlaced.length === q.pieces.length) {
      const built = nextPlaced.map((i) => pool.find((t) => t.id === i)!.text)
      onAnswer(built.every((t, i) => t === q.pieces[i]))
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <Prompt q={q} showMeaning={showMeaning} label="Build the phrase for" />
      {!showMeaning && <ListenButtons onListen={onListen} />}
      <div className={`flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 ${verdict ? (verdict.right ? 'border-emerald-400' : 'border-rose-400') : 'border-slate-300 dark:border-slate-700'}`}>
        {placed.length === 0 && <span className="text-sm text-slate-400">Tap the pieces below in order…</span>}
        {placed.map((id) => (
          <TileButton key={id} text={pool.find((t) => t.id === id)!.text} disabled={!!verdict} onClick={() => !verdict && setPlaced(placed.filter((p) => p !== id))} />
        ))}
      </div>
      <div className="flex min-h-14 flex-wrap justify-center gap-2">
        {pool.filter((t) => !placed.includes(t.id)).map((t) => (
          <TileButton key={t.id} text={t.text} onClick={() => place(t.id)} disabled={!!verdict} />
        ))}
      </div>
    </div>
  )
}

function FillGap({ q, verdict, onAnswer, onListen, latin, locale, showMeaning }: QProps & { latin: boolean; locale: string; showMeaning: boolean }) {
  const [typed, setTyped] = useState('')
  const [spelled, setSpelled] = useState<number[]>([])
  const letters = useMemo<Tile[]>(() => shuffle(graphemes(q.gap.word, locale).map((text, id) => ({ id, text }))), [q, locale])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const checkTyped = () => {
    if (verdict || !typed.trim()) return
    const exact = typed.trim().toLowerCase() === q.gap.word.toLowerCase()
    const close = normalize(typed) === normalize(q.gap.word)
    onAnswer(exact || close, !exact && close ? `Watch the accents: it's spelled “${q.gap.word}”.` : undefined)
  }

  const spell = (id: number) => {
    if (verdict) return
    const next = [...spelled, id]
    setSpelled(next)
    if (next.length === letters.length) {
      onAnswer(next.map((i) => letters.find((l) => l.id === i)!.text).join('') === q.gap.word)
    }
  }

  const fill = latin ? typed : spelled.map((i) => letters.find((l) => l.id === i)!.text).join('')

  return (
    <div className="mt-6 space-y-6">
      <Prompt q={q} showMeaning={showMeaning} label="Complete the phrase for" />
      <ListenButtons onListen={onListen} />
      <p className="text-center text-2xl leading-relaxed font-semibold text-slate-900 dark:text-white" dir="auto">
        {q.gap.before}
        <span className={`mx-1 inline-block min-w-20 border-b-4 px-2 ${verdict ? (verdict.right ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600') : 'border-primary-400 text-primary-600'}`}>
          {fill || ' '}
        </span>
        {q.gap.after}
      </p>

      {latin ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            checkTyped()
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={!!verdict}
            placeholder="Type the missing word"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800"
          />
          <button type="submit" disabled={!!verdict || !typed.trim()} className="rounded-2xl bg-primary-600 px-5 font-bold text-white shadow-md disabled:opacity-40">
            Check
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-center gap-2">
            {letters.filter((l) => !spelled.includes(l.id)).map((l) => (
              <TileButton key={l.id} text={l.text} onClick={() => spell(l.id)} disabled={!!verdict} />
            ))}
          </div>
          {spelled.length > 0 && !verdict && (
            <div className="text-center">
              <button onClick={() => setSpelled(spelled.slice(0, -1))} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600">
                <Delete className="size-4" /> Undo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Results ---------- */

function Results({
  stars, correct, total, earned, missed, lang, test, onRetry, onExit, onNextTest,
}: {
  stars: number
  correct: number
  total: number
  earned: number
  missed: LearnPhrase[]
  lang: CatalogLanguage
  test: number
  onRetry: () => void
  onExit: () => void
  onNextTest: () => void
}) {
  const passed = stars >= 1
  const title = stars === 3 ? 'Flawless!' : stars === 2 ? 'Great work!' : stars === 1 ? 'You passed!' : 'Keep going!'

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {passed && <Confetti pieces={stars * 40} />}
      <div className="flex justify-center">
        <Mascot size={110} mood={passed ? 'cheer' : 'think'} />
      </div>
      <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-3">
        <Stars value={stars} size="text-4xl" animate />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{correct}/{total}</p>
          <p className="text-xs font-medium text-emerald-800/70 dark:text-emerald-300/70">correct</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }} className="text-2xl font-black text-amber-600 dark:text-amber-400">+{earned}</motion.p>
          <p className="text-xs font-medium text-amber-800/70 dark:text-amber-300/70">XP earned</p>
        </div>
      </div>

      {missed.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-800/60">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">🧠 Added to your review queue</p>
          <ul className="mt-2 space-y-1.5">
            {missed.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{p.picture}</span>
                <button onClick={() => speak(p.text, lang.speechCode)} className="font-medium text-slate-900 hover:text-primary-600 dark:text-white" dir="auto">{p.text}</button>
                <span className="text-slate-400">· {p.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!passed && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Get half right to earn a star and unlock the next test.</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
          <RotateCcw className="size-4" /> Try again
        </button>
        {passed && test < tests.length ? (
          <button onClick={onNextTest} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-primary-700">
            Next: {tests[test].title} <ArrowRight className="size-4" />
          </button>
        ) : (
          <button onClick={onExit} className="rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-primary-700">
            Back to the phrases
          </button>
        )}
      </div>
    </motion.div>
  )
}
