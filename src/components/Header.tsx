import { Flame, Menu, Moon, Search, Sun, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../context/progress'
import { languages } from '../data/languages'
import Logo from './Logo'

interface Props {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenMenu: () => void
}

export default function Header({ theme, onToggleTheme, onOpenMenu }: Props) {
  const { xp, streak } = useProgress()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const matches = query
    ? languages.filter((l) =>
        `${l.name} ${l.nativeName}`.toLowerCase().includes(query.toLowerCase()),
      )
    : []

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="lg:w-60">
          <Logo />
        </div>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search languages…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-600/10 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-900"
          />
          {matches.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              {matches.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => {
                      navigate(`/languages/${l.id}`)
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-xl">{l.flag}</span>
                    <span className="font-medium">{l.name}</span>
                    <span className="ml-auto text-xs text-slate-400">#{l.rank}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-600 sm:flex dark:bg-orange-500/10 dark:text-orange-400">
            <Flame className="size-4" /> {streak}
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700 sm:flex dark:bg-primary-600/10 dark:text-primary-400">
            <Zap className="size-4" /> {xp} XP
          </div>
          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </motion.button>
          <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
            R
          </div>
        </div>
      </div>
    </header>
  )
}
