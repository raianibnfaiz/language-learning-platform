import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export type Mood = 'happy' | 'cheer' | 'think' | 'oops'

/** Pip, the LinguaWealth sprout. A friendly guide that reacts to how the learner is doing. */
export function Mascot({ mood = 'happy', size = 96, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const mouth = {
    happy: 'M38 60 Q50 70 62 60',
    cheer: 'M36 57 Q50 76 64 57 Z',
    think: 'M42 63 L58 61',
    oops: 'M40 66 Q50 58 60 66',
  }[mood]

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
      animate={mood === 'cheer' ? { y: [0, -10, 0], rotate: [0, -6, 6, 0] } : { y: [0, -4, 0] }}
      transition={{ duration: mood === 'cheer' ? 0.7 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* leaves */}
      <motion.g
        style={{ originX: '50px', originY: '26px' }}
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M50 26 C40 8 24 10 22 18 C30 26 42 28 50 26 Z" fill="#45bd63" />
        <path d="M50 26 C60 6 78 8 80 16 C72 26 58 28 50 26 Z" fill="#1d9a3a" />
        <path d="M50 30 L50 22" stroke="#0b771a" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
      {/* body */}
      <ellipse cx="50" cy="60" rx="34" ry="30" fill="#0b771a" />
      <ellipse cx="50" cy="64" rx="26" ry="22" fill="#7fd895" />
      {/* cheeks */}
      <circle cx="31" cy="62" r="5" fill="#fb7185" opacity="0.55" />
      <circle cx="69" cy="62" r="5" fill="#fb7185" opacity="0.55" />
      {/* eyes */}
      {mood === 'cheer' ? (
        <>
          <path d="M34 50 Q39 44 44 50" stroke="#032409" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M56 50 Q61 44 66 50" stroke="#032409" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="39" cy="50" r="5" fill="#032409" />
          <circle cx="61" cy="50" r="5" fill="#032409" />
          <circle cx="40.5" cy="48.5" r="1.6" fill="#fff" />
          <circle cx="62.5" cy="48.5" r="1.6" fill="#fff" />
        </>
      )}
      {mood === 'think' && <circle cx="80" cy="34" r="4" fill="#7fd895" />}
      {mood === 'oops' && <path d="M74 40 q3 6 0 8 q-3 -2 0 -8" fill="#38bdf8" />}
      <path d={mouth} stroke="#032409" strokeWidth="3" fill={mood === 'cheer' ? '#032409' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

const confettiColors = ['#0b771a', '#45bd63', '#f59e0b', '#f43f5e', '#38bdf8', '#a855f7', '#facc15']

/** A burst of confetti that falls over the whole screen. Re-mount (change `key`) to fire again. */
export function Confetti({ pieces = 80 }: { pieces?: number }) {
  // Random layout is picked once per mount, in the state initializer
  const [bits] = useState(() =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 220,
        spin: (Math.random() - 0.5) * 900,
        color: confettiColors[i % confettiColors.length],
        w: 6 + Math.random() * 6,
        round: Math.random() > 0.6,
      })),
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute top-0 block"
          style={{ left: `${b.left}%`, width: b.w, height: b.round ? b.w : b.w * 1.6, background: b.color, borderRadius: b.round ? 999 : 2 }}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: b.drift, rotate: b.spin, opacity: [1, 1, 0.8] }}
          transition={{ duration: b.duration, delay: b.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

/** "+10 XP" that floats up and fades. Pass a changing `id` per award. */
export function XpPop({ id, amount }: { id: number; amount: number }) {
  return (
    <AnimatePresence>
      {amount > 0 && (
        <motion.span
          key={id}
          initial={{ opacity: 0, y: 6, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: -36, scale: 1.1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-sm font-black whitespace-nowrap text-amber-950 shadow-lg"
        >
          +{amount} XP
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/** Three stars, filled up to `value`, popping in one after another */
export function Stars({ value, size = 'text-2xl', animate = false }: { value: number; size?: string; animate?: boolean }) {
  return (
    <span className={`inline-flex gap-0.5 ${size}`} aria-label={`${value} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <motion.span
          key={n}
          initial={animate ? { scale: 0, rotate: -90 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: animate ? 0.25 + n * 0.18 : 0 }}
          className={n <= value ? '' : 'opacity-25 grayscale'}
        >
          ⭐
        </motion.span>
      ))}
    </span>
  )
}
