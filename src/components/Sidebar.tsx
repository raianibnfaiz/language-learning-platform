import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { usePhrasebook } from '../context/phrasebook'
import { useProgress } from '../context/progress'
import { languages } from '../data/languages'
import Logo from './Logo'
import { mainNav } from './nav'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { completedLessons } = useProgress()
  const { due } = usePhrasebook()

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div>
        <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Menu</p>
        <ul className="space-y-1">
          {mainNav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-600/15"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon className="relative size-4.5" />
                    <span className="relative">{label}</span>
                    {to === '/review' && due.length > 0 && (
                      <motion.span
                        key={due.length}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950"
                      >
                        {due.length}
                      </motion.span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Career courses
        </p>
        <ul className="space-y-1">
          {languages.map((l) => {
            const done = l.lessons.filter((x) => completedLessons.includes(x.id)).length
            const pct = Math.round((done / l.lessons.length) * 100)
            return (
              <li key={l.id}>
                <NavLink
                  to={`/languages/${l.id}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2 transition-colors ${
                      isActive ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="text-lg">{l.flag}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{l.name}</span>
                    <span className="ml-auto text-xs text-slate-400">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${l.gradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-auto rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 p-4 text-white">
        <p className="text-sm font-semibold">Daily goal</p>
        <p className="mt-1 text-xs text-white/80">Learn a few phrases a day to keep your streak alive.</p>
        <NavLink
          to="/phrasebook"
          onClick={onNavigate}
          className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/30"
        >
          Open phrasebook →
        </NavLink>
      </div>
    </nav>
  )
}

interface Props {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  return (
    <>
      {/* Desktop */}
      <aside className="print:hidden sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200/70 bg-white/60 lg:block dark:border-slate-800 dark:bg-slate-950/60">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl lg:hidden dark:bg-slate-950"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                <Logo />
                <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
