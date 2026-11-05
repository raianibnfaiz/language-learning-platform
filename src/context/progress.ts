import { createContext, useContext } from 'react'

export interface ProgressState {
  completedLessons: string[]
  xp: number
  /** XP earned per day, keyed by YYYY-MM-DD */
  activity: Record<string, number>
  bookmarks: string[]
}

export interface ProgressContextValue extends ProgressState {
  streak: number
  toggleLesson: (lessonId: string) => void
  addXp: (amount: number) => void
  toggleBookmark: (lessonId: string) => void
  reset: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}

/** Local calendar date as YYYY-MM-DD (not UTC, so streaks follow the learner's day) */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
