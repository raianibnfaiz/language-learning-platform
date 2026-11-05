import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

/** Card that fades and lifts into view; pass `delay` to stagger a group */
export function Card({
  children,
  className = '',
  delay = 0,
  ...rest
}: { children: ReactNode; className?: string; delay?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function ProgressBar({ value, gradient = 'from-primary-600 to-primary-400', delay = 0 }: { value: number; gradient?: string; delay?: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.9, delay, ease: 'easeOut' }}
      />
    </div>
  )
}

export function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    Intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    Advanced: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    Easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    Moderate: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    Hard: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[level] ?? ''}`}>{level}</span>
}
