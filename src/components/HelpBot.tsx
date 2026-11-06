import { MessageCircleQuestion, RotateCcw, Send, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { levelFor, usePhrasebook } from '../context/phrasebook'
import { useProgress } from '../context/progress'
import { answer, starterQuestions, type BotReply } from '../data/helpBot'
import { getCatalogLanguage } from '../data/phrasebook/catalog'
import { Mascot } from './fun'

interface Message extends BotReply {
  id: number
  from: 'bot' | 'user'
}

const welcome: Message = {
  id: 0,
  from: 'bot',
  text: "Hi! I'm **Pip** 🌱 Ask me how to use LinguaWealth, or tap a question below.",
  suggestions: starterQuestions,
}

/** Turns **bold** and line breaks into elements */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j): ReactNode =>
            part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong> : part,
          )}
        </Fragment>
      ))}
    </>
  )
}

/** A floating help assistant that answers questions about using the site */
export default function HelpBot() {
  const { xp, streak } = useProgress()
  const { due, heard, recent } = usePhrasebook()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcome])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const nextId = useRef(1)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  // Escape closes the chat
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ask = (question: string) => {
    const q = question.trim()
    if (!q || typing) return
    setDraft('')
    setMessages((m) => [...m, { id: nextId.current++, from: 'user', text: q }])
    setTyping(true)
    const reply = answer(q, {
      due: due.length,
      heard: heard.length,
      xp,
      level: levelFor(xp).level,
      streak,
      recentLanguage: getCatalogLanguage(recent[0]),
    })
    // A short "typing" pause feels friendlier than an instant wall of text
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, from: 'bot', ...reply }])
      setTyping(false)
    }, 450 + Math.min(900, reply.text.length * 2))
  }

  const lastBot = [...messages].reverse().find((m) => m.from === 'bot')

  return (
    <div className="print:hidden">
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Help chat with Pip"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed right-4 bottom-24 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary-600 to-emerald-500 px-4 py-3 text-white">
              <Mascot size={44} mood={typing ? 'think' : 'happy'} />
              <div className="flex-1">
                <p className="font-bold">Pip · Help</p>
                <p className="text-xs text-white/80">{typing ? 'Typing…' : 'Ask me how anything works'}</p>
              </div>
              <button onClick={() => setMessages([welcome])} className="rounded-lg p-1.5 hover:bg-white/20" aria-label="Start over" title="Start over">
                <RotateCcw className="size-4" />
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/20" aria-label="Close help">
                <X className="size-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.from === 'user'
                        ? 'rounded-br-md bg-primary-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <RichText text={m.text} />
                    {m.links && m.links.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.links.map((l) => (
                          <Link
                            key={l.to + l.label}
                            to={l.to}
                            onClick={() => setOpen(false)}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm hover:bg-primary-50 dark:bg-slate-900 dark:text-primary-300"
                          >
                            {l.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800" style={{ width: 'fit-content' }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2 rounded-full bg-slate-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
              {!typing && lastBot?.suggestions && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lastBot.suggestions.map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => ask(s)}
                      className="rounded-full border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-600/50 dark:text-primary-300 dark:hover:bg-primary-600/10"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ask(draft)
              }}
              className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
            >
              <input
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Your question"
                maxLength={300}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
              />
              <button type="submit" disabled={!draft.trim() || typing} className="grid size-9 place-items-center rounded-xl bg-primary-600 text-white disabled:opacity-40" aria-label="Send">
                <Send className="size-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed right-4 bottom-4 z-50 grid size-16 place-items-center rounded-full bg-gradient-to-br from-primary-600 to-emerald-500 text-white shadow-xl shadow-primary-600/30"
        aria-label={open ? 'Close help' : 'Open help chat'}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="size-7" />
            </motion.span>
          ) : (
            <motion.span key="q" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircleQuestion className="size-7" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full ring-4 ring-primary-400/50"
            animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  )
}
