import { ArrowLeft, Eye, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Confetti, Mascot, XpPop } from '../../components/fun'
import { randomCheer } from '../../lib/cheers'
import { PageHeader } from '../../components/ui'
import { todayKey, useProgress } from '../../context/progress'
import { MASTERED_BOX, usePhrasebook } from '../../context/phrasebook'
import { getCatalogLanguage } from '../../data/phrasebook/catalog'
import { findPhrase } from '../../data/phrasebook/phrases'
import { speak } from '../../lib/speech'
import { shuffle } from '../../lib/text'

const XP_PER_RECALL = 5

function resolve(key: string) {
  const [langId, phraseId] = key.split(':')
  const lang = getCatalogLanguage(langId)
  const found = lang && findPhrase(langId, phraseId)
  return lang && found ? { key, lang, ...found } : undefined
}

export default function Review() {
  const [params] = useSearchParams()
  const onlyLang = params.get('lang')
  const { due, review, answerReview } = usePhrasebook()
  const { addXp } = useProgress()

  // Freeze the session queue when the page opens, so answering does not reshuffle it
  const [queue, setQueue] = useState(() =>
    shuffle(due.filter((k) => !onlyLang || k.startsWith(`${onlyLang}:`)))
      .map(resolve)
      .filter((c) => !!c),
  )
  const [startSize] = useState(queue.length)
  const [revealed, setRevealed] = useState(false)
  const [knew, setKnew] = useState(0)
  const [retried, setRetried] = useState<string[]>([])
  const [pop, setPop] = useState({ id: 0, amount: 0 })
  const [cheer, setCheer] = useState<string | null>(null)

  const card = queue[0]

  const grade = (gotIt: boolean) => {
    if (!card) return
    answerReview(card.key, gotIt)
    setRevealed(false)
    if (gotIt) {
      addXp(XP_PER_RECALL)
      setKnew((k) => k + 1)
      setPop((p) => ({ id: p.id + 1, amount: XP_PER_RECALL }))
      setCheer(randomCheer())
      setQueue((q) => q.slice(1))
    } else {
      setCheer(null)
      // One more go at the end of this session
      const again = !retried.includes(card.key)
      if (again) setRetried((r) => [...r, card.key])
      setQueue((q) => (again ? [...q.slice(1), q[0]] : q.slice(1)))
    }
  }

  // Upcoming reviews, for the empty state
  const today = todayKey()
  const upcoming = Object.values(review).filter((c) => c.due > today).length

  if (!startSize) {
    return (
      <>
        <PageHeader title="Review" subtitle="Spaced repetition brings back the phrases you missed, right before you forget them." />
        <div className="mx-auto grid max-w-md place-items-center rounded-3xl border border-slate-200/70 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <Mascot mood="cheer" size={110} />
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">All caught up!</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {upcoming ? `${upcoming} phrase${upcoming === 1 ? ' is' : 's are'} scheduled for later. Come back tomorrow to keep your streak.` : 'Take a test in the phrasebook. Anything you miss lands here.'}
          </p>
          <Link to="/phrasebook" className="mt-5 rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-primary-700">
            Open the phrasebook
          </Link>
        </div>
      </>
    )
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200/70 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
        <Confetti />
        <div className="flex justify-center"><Mascot mood="cheer" size={110} /></div>
        <h2 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Review done!</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          You recalled {knew} phrase{knew === 1 ? '' : 's'} and earned {knew * XP_PER_RECALL} XP. Each one will come back a little later next time.
        </p>
        <Link to="/phrasebook" className="mt-6 inline-block rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-primary-700">
          Back to the phrasebook
        </Link>
      </div>
    )
  }

  const box = review[card.key]?.box ?? 0
  const isEnglish = card.lang.id === 'english'

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/phrasebook" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" initial={{ width: 0 }} animate={{ width: `${(knew / startSize) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-slate-500">{queue.length} left</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${card.key}-${queue.length}`}
          initial={{ rotateY: -70, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ x: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className={`relative grid h-48 place-items-center bg-gradient-to-br ${card.situation.gradient}`}>
            <motion.span className="text-8xl drop-shadow-xl" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
              {card.phrase.picture}
            </motion.span>
            <span className="absolute top-3 left-3 rounded-full bg-black/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {card.lang.flag} {card.lang.name} · {card.situation.title}
            </span>
            <span className="absolute top-3 right-3 flex gap-1" title={`Memory strength ${box}/${MASTERED_BOX}`}>
              {Array.from({ length: MASTERED_BOX }, (_, i) => (
                <span key={i} className={`size-2 rounded-full ${i < box ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </span>
          </div>
          <div className="relative p-6 text-center sm:p-8">
            <XpPop id={pop.id} amount={pop.amount} />
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">How do you say…</p>
            {!isEnglish && <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">“{card.phrase.meaning}”</p>}

            <AnimatePresence mode="wait">
              {revealed ? (
                <motion.div key="answer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                  <p className="text-3xl font-black text-primary-700 dark:text-primary-300" dir="auto">{card.phrase.text}</p>
                  {card.phrase.romanization && <p className="mt-1 text-slate-500 italic">{card.phrase.romanization}</p>}
                  <button onClick={() => speak(card.phrase.text, card.lang.speechCode)} className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600">
                    <Volume2 className="size-4" /> Hear it again
                  </button>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={() => grade(false)} className="rounded-2xl border-2 border-b-4 border-rose-300 bg-rose-50 py-3 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
                      😬 Not yet
                    </button>
                    <button onClick={() => grade(true)} className="rounded-2xl border-2 border-b-4 border-emerald-400 bg-emerald-50 py-3 font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                      😎 Got it
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Say it out loud first, then check yourself.</p>
                  <button
                    onClick={() => {
                      setRevealed(true)
                      speak(card.phrase.text, card.lang.speechCode)
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-bold text-white shadow-md hover:bg-primary-700"
                  >
                    <Eye className="size-4" /> Show answer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {cheer && (
          <motion.p key={pop.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
            {cheer} 🎉
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
