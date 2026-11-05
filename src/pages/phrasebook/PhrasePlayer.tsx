import { BookmarkPlus, Check, ChevronLeft, ChevronRight, Mic, NotebookPen, Pause, Play, Snail, Square, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import VoicePicker from '../../components/VoicePicker'
import { Mascot, XpPop } from '../../components/fun'
import { randomCheer } from '../../lib/cheers'
import { useProgress } from '../../context/progress'
import { phraseKey, usePhrasebook } from '../../context/phrasebook'
import type { CatalogLanguage } from '../../data/phrasebook/catalog'
import type { LearnPhrase, Situation } from '../../data/phrasebook/phrases'
import { canRecognize, listenOnce, speak, stopSpeaking, RATE_NORMAL, RATE_SLOW } from '../../lib/speech'
import { similarity } from '../../lib/text'

const XP_FIRST_LISTEN = 2
const XP_GOOD_SPEAK = 5

type MicState =
  | { kind: 'idle' }
  | { kind: 'listening' }
  | { kind: 'result'; score: number; heard: string }
  | { kind: 'error'; message: string }

interface Props {
  lang: CatalogLanguage
  situation: Situation
  phrases: LearnPhrase[]
  onStartTests: () => void
}

export default function PhrasePlayer({ lang, situation, phrases, onStartTests }: Props) {
  const { addXp } = useProgress()
  const { heard, markHeard, notes, setNote, review, addToReview } = usePhrasebook()
  const [index, setIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [mic, setMic] = useState<MicState>({ kind: 'idle' })
  const [pop, setPop] = useState({ id: 0, amount: 0 })
  const stopListening = useRef<() => void>(() => {})

  const phrase = phrases[index]
  const key = phraseKey(lang.id, phrase.id)
  const heardCount = phrases.filter((p) => heard.includes(phraseKey(lang.id, p.id))).length
  const allHeard = heardCount === phrases.length

  const reward = useCallback(
    (amount: number) => {
      addXp(amount)
      setPop((p) => ({ id: p.id + 1, amount }))
    },
    [addXp],
  )

  const play = useCallback(
    (rate: number, onEnd?: () => void) => {
      speak(phrase.text, lang.speechCode, rate, onEnd)
      if (markHeard(key)) reward(XP_FIRST_LISTEN)
    },
    [phrase.text, lang.speechCode, key, markHeard, reward],
  )

  const go = useCallback(
    (to: number) => {
      stopListening.current()
      setMic({ kind: 'idle' })
      setShowNote(false)
      setIndex(Math.max(0, Math.min(phrases.length - 1, to)))
    },
    [phrases.length],
  )

  // Keep the latest `play` in a ref so autoplay only restarts when the phrase changes
  const playRef = useRef(play)
  useEffect(() => {
    playRef.current = play
  })

  // Autoplay walks through the whole situation, pausing a beat between phrases
  useEffect(() => {
    if (!autoplay) return
    let timer: number | undefined
    const run = { cancelled: false }
    playRef.current(RATE_NORMAL, () => {
      if (run.cancelled) return
      timer = window.setTimeout(() => {
        if (index < phrases.length - 1) setIndex((i) => i + 1)
        else setAutoplay(false)
      }, 1200)
    })
    return () => {
      run.cancelled = true
      window.clearTimeout(timer)
    }
  }, [autoplay, index, phrases.length])

  useEffect(() => () => stopSpeaking(), [])

  // Arrow keys to move, space to play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === ' ') {
        e.preventDefault()
        play(RATE_NORMAL)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index, play])

  const sayIt = async () => {
    if (mic.kind === 'listening') {
      stopListening.current()
      return
    }
    stopSpeaking()
    setMic({ kind: 'listening' })
    const { promise, stop } = listenOnce(lang.speechCode)
    stopListening.current = stop
    try {
      const alternatives = await promise
      if (!alternatives.length) {
        setMic({ kind: 'error', message: "I didn't catch that. Try again a little louder." })
        return
      }
      const best = alternatives
        .map((t) => ({ t, s: Math.max(similarity(t, phrase.text), phrase.romanization ? similarity(t, phrase.romanization) : 0) }))
        .sort((a, b) => b.s - a.s)[0]
      const score = Math.round(best.s * 100)
      setMic({ kind: 'result', score, heard: best.t })
      if (score >= 70) reward(XP_GOOD_SPEAK)
    } catch (err) {
      const message = (err as Error).message === 'not-allowed' ? 'Microphone access was blocked. Allow it in your browser to practise speaking.' : 'Speech recognition is not available for this language here.'
      setMic({ kind: 'error', message })
    }
  }

  const inReview = !!review[key]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      {/* Phrase list */}
      <div className="order-2 rounded-2xl border border-slate-200/70 bg-white p-3 lg:order-1 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between px-2 pt-1 pb-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{heardCount}/{phrases.length} heard</p>
          <button
            onClick={() => {
              if (autoplay) stopSpeaking()
              setAutoplay(!autoplay)
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${autoplay ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {autoplay ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} {autoplay ? 'Stop' : 'Play all'}
          </button>
        </div>
        <ul className="space-y-1">
          {phrases.map((p, i) => {
            const done = heard.includes(phraseKey(lang.id, p.id))
            return (
              <li key={p.id}>
                <button
                  onClick={() => go(i)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === index ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                >
                  {i === index && <motion.span layoutId="phrase-active" className="absolute inset-0 rounded-xl bg-primary-50 ring-2 ring-primary-400/50 dark:bg-primary-600/15" />}
                  <span className="relative text-2xl">{p.picture}</span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900 dark:text-white" dir="auto">{p.text}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.meaning}</span>
                  </span>
                  {done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3" />
                    </motion.span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <motion.button
          onClick={onStartTests}
          animate={allHeard ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 1.4, repeat: allHeard ? Infinity : 0 }}
          className={`mt-3 w-full rounded-xl bg-gradient-to-r ${situation.gradient} px-4 py-3 font-semibold text-white shadow-md`}
        >
          {allHeard ? 'Ready! Take the tests 🚀' : 'Skip to the tests →'}
        </motion.button>
      </div>

      {/* Stage */}
      <div className="order-1 lg:order-2">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className={`relative grid h-56 place-items-center bg-gradient-to-br ${situation.gradient} sm:h-64`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={phrase.id}
                initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.3, rotate: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className="relative"
              >
                <motion.span
                  className="block text-8xl drop-shadow-xl sm:text-9xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {phrase.picture}
                </motion.span>
              </motion.div>
            </AnimatePresence>
            <span className="absolute top-3 left-3 rounded-full bg-black/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {index + 1} / {phrases.length}
            </span>
            {inReview && <span className="absolute top-3 right-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">In review</span>}
          </div>

          <div className="p-6 text-center sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={phrase.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <p className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white" dir="auto" lang={lang.speechCode}>{phrase.text}</p>
                {phrase.romanization && <p className="mt-2 text-lg text-primary-700 italic dark:text-primary-300">{phrase.romanization}</p>}
                <p className="mt-2 text-slate-500 dark:text-slate-400">{phrase.meaning}</p>
              </motion.div>
            </AnimatePresence>

            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <XpPop id={pop.id} amount={pop.amount} />
              <button onClick={() => go(index - 1)} disabled={index === 0} className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300" aria-label="Previous phrase">
                <ChevronLeft className="size-5" />
              </button>
              <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} onClick={() => play(RATE_NORMAL)} className="grid size-16 place-items-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30" aria-label="Play">
                <Volume2 className="size-7" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => play(RATE_SLOW)} className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" aria-label="Play slowly" title="Slow">
                <Snail className="size-5" />
              </motion.button>
              {canRecognize() && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sayIt}
                  className={`grid size-12 place-items-center rounded-full ${mic.kind === 'listening' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'}`}
                  aria-label={mic.kind === 'listening' ? 'Stop listening' : 'Say it'}
                  title="Say it"
                  animate={mic.kind === 'listening' ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ duration: 0.9, repeat: mic.kind === 'listening' ? Infinity : 0 }}
                >
                  {mic.kind === 'listening' ? <Square className="size-4" /> : <Mic className="size-5" />}
                </motion.button>
              )}
              <button onClick={() => setShowNote((s) => !s)} className={`grid size-12 place-items-center rounded-full ${notes[key] ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`} aria-label="Notes" title="My notes">
                <NotebookPen className="size-5" />
              </button>
              <button onClick={() => go(index + 1)} disabled={index === phrases.length - 1} className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300" aria-label="Next phrase">
                <ChevronRight className="size-5" />
              </button>
            </div>

            <AnimatePresence>
              {mic.kind !== 'idle' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mx-auto mt-5 flex max-w-md items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left text-sm dark:bg-slate-800/60">
                    <Mascot size={52} mood={mic.kind === 'listening' ? 'think' : mic.kind === 'result' && mic.score >= 70 ? 'cheer' : 'oops'} />
                    <div>
                      {mic.kind === 'listening' && <p className="font-medium">Listening… say the phrase out loud.</p>}
                      {mic.kind === 'error' && <p>{mic.message}</p>}
                      {mic.kind === 'result' && (
                        <>
                          <p className="font-semibold">{mic.score >= 85 ? randomCheer() : mic.score >= 70 ? 'Nice, very close!' : 'Keep practising, you will get there.'} {mic.score}% match</p>
                          <p className="text-slate-500 dark:text-slate-400" dir="auto">I heard: “{mic.heard}”</p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              {showNote && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <textarea
                    value={notes[key] ?? ''}
                    onChange={(e) => setNote(key, e.target.value)}
                    placeholder="Your memory trick, a grammar note, where you'd use it…"
                    rows={3}
                    className="mx-auto mt-5 block w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm outline-none focus:ring-4 focus:ring-amber-300/30 dark:border-amber-500/30 dark:bg-amber-500/10"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!inReview && (
              <button onClick={() => addToReview([key])} className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600">
                <BookmarkPlus className="size-4" /> Add to my review queue
              </button>
            )}
            <div className="mx-auto mt-5 max-w-md">
              <VoicePicker lang={lang.speechCode} sample={phrase.text} languageName={lang.name} />
            </div>
            <p className="mt-3 hidden text-xs text-slate-400 sm:block">Tip: ← → to move, space to listen</p>
          </div>
        </div>
      </div>
    </div>
  )
}
