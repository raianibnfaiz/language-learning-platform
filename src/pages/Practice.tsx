import { Check, RotateCcw, Trophy, Volume2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, PageHeader } from '../components/ui'
import { speak } from '../lib/speech'
import { useProgress } from '../context/progress'
import { getLanguage, languages, type Phrase } from '../data/languages'

const XP_PER_CORRECT = 10

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Question {
  answer: Phrase
  options: Phrase[]
}

function buildQuiz(phrases: Phrase[]): Question[] {
  return shuffle(phrases).map((answer) => ({
    answer,
    options: shuffle([answer, ...shuffle(phrases.filter((p) => p !== answer)).slice(0, 3)]),
  }))
}

export default function Practice() {
  const [params, setParams] = useSearchParams()
  const lang = getLanguage(params.get('lang') ?? undefined) ?? languages[0]
  const { addXp } = useProgress()

  const [round, setRound] = useState(0)
  // `round` is a dependency so "Play again" reshuffles the questions
  const quiz = useMemo(() => (round >= 0 ? buildQuiz(lang.phrases) : []), [lang.phrases, round])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Phrase | null>(null)
  const [score, setScore] = useState(0)

  const restart = () => {
    setRound((r) => r + 1)
    setIndex(0)
    setPicked(null)
    setScore(0)
  }

  const chooseLanguage = (id: string) => {
    setParams({ lang: id })
    restart()
  }

  const finished = index >= quiz.length
  const q = quiz[index]

  const pick = (option: Phrase) => {
    if (picked) return
    setPicked(option)
    speak(q.answer.text, lang.speechCode)
    if (option === q.answer) {
      setScore((s) => s + 1)
      addXp(XP_PER_CORRECT)
    }
  }

  return (
    <>
      <PageHeader title="Practice" subtitle="Pick the phrase that matches the meaning. Each correct answer earns 10 XP." />

      <div className="mb-6 flex flex-wrap gap-2">
        {languages.map((l) => (
          <button
            key={l.id}
            onClick={() => chooseLanguage(l.id)}
            className={`relative rounded-xl px-4 py-2 text-sm font-medium transition ${l.id === lang.id ? 'text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            {l.id === lang.id && <motion.span layoutId="practice-lang" className={`absolute inset-0 rounded-xl bg-gradient-to-r ${l.gradient} shadow-md`} />}
            <span className="relative">{l.flag} {l.name}</span>
          </button>
        ))}
      </div>

      <Card className="mx-auto max-w-2xl overflow-hidden p-0">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
          <motion.div className={`h-full bg-gradient-to-r ${lang.gradient}`} initial={{ width: 0 }} animate={{ width: `${(index / quiz.length) * 100}%` }} />
        </div>
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {finished ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                  <Trophy className="size-10" />
                </motion.div>
                <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">Round complete!</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  You got {score} of {quiz.length} right and earned {score * XP_PER_CORRECT} XP.
                </p>
                <button onClick={restart} className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${lang.gradient} px-5 py-2.5 font-semibold text-white shadow-md`}>
                  <RotateCcw className="size-4" /> Play again
                </button>
              </motion.div>
            ) : (
              <motion.div key={`${round}-${index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Question {index + 1} of {quiz.length}</span>
                  <span>Score: {score}</span>
                </div>
                <p className="mt-6 text-xs font-semibold tracking-wider text-slate-400 uppercase">How do you say…</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">“{q.answer.meaning}”</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {q.options.map((o) => {
                    const isAnswer = o === q.answer
                    const state = !picked ? 'idle' : isAnswer ? 'right' : o === picked ? 'wrong' : 'dim'
                    return (
                      <motion.button
                        key={o.text}
                        whileHover={!picked ? { scale: 1.02 } : undefined}
                        whileTap={!picked ? { scale: 0.97 } : undefined}
                        animate={state === 'wrong' ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                        onClick={() => pick(o)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left font-medium transition-colors ${
                          state === 'right' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : state === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                          : state === 'dim' ? 'border-slate-200 opacity-50 dark:border-slate-800'
                          : 'border-slate-200 hover:border-primary-400 dark:border-slate-700'
                        }`}
                      >
                        <span className="flex-1">
                          {o.text}
                          {o.romanization && <span className="block text-xs font-normal opacity-70">{o.romanization}</span>}
                        </span>
                        {state === 'right' && <Check className="size-5" />}
                        {state === 'wrong' && <X className="size-5" />}
                      </motion.button>
                    )
                  })}
                </div>
                {picked && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center justify-between gap-3">
                    <button onClick={() => speak(q.answer.text, lang.speechCode)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600">
                      <Volume2 className="size-4" /> Hear it again
                    </button>
                    <button onClick={() => { setIndex((i) => i + 1); setPicked(null) }} className={`rounded-xl bg-gradient-to-r ${lang.gradient} px-5 py-2.5 text-sm font-semibold text-white shadow-md`}>
                      {index + 1 === quiz.length ? 'Finish' : 'Next'}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </>
  )
}
