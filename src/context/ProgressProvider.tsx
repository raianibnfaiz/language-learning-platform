import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ProgressContext, dayKey, type ProgressState } from './progress'

const STORAGE_KEY = 'linguawealth.progress'
const LESSON_XP = 50

/** A little starter history so the dashboard charts are not empty on first visit */
function seedState(): ProgressState {
  const activity: Record<string, number> = {}
  const pattern = [40, 0, 70, 30, 90, 60]
  pattern.forEach((xp, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (pattern.length - i))
    if (xp) activity[dayKey(d)] = xp
  })
  return {
    completedLessons: ['en-1', 'en-2', 'es-1', 'de-1'],
    xp: 290,
    activity,
    bookmarks: ['es-4', 'zh-1'],
  }
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProgressState
  } catch {
    // ignore corrupt storage and start fresh
  }
  return seedState()
}

function computeStreak(activity: Record<string, number>) {
  let streak = 0
  const d = new Date()
  // Today does not break the streak if the learner has not practiced yet
  if (!activity[dayKey(d)]) d.setDate(d.getDate() - 1)
  while (activity[dayKey(d)]) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addXp = useCallback((amount: number) => {
    setState((s) => {
      const today = dayKey(new Date())
      return {
        ...s,
        xp: Math.max(0, s.xp + amount),
        activity: { ...s.activity, [today]: Math.max(0, (s.activity[today] ?? 0) + amount) },
      }
    })
  }, [])

  const toggleLesson = useCallback(
    (lessonId: string) => {
      setState((s) => {
        const done = s.completedLessons.includes(lessonId)
        return {
          ...s,
          completedLessons: done
            ? s.completedLessons.filter((id) => id !== lessonId)
            : [...s.completedLessons, lessonId],
        }
      })
    },
    [],
  )

  const toggleBookmark = useCallback((lessonId: string) => {
    setState((s) => ({
      ...s,
      bookmarks: s.bookmarks.includes(lessonId)
        ? s.bookmarks.filter((id) => id !== lessonId)
        : [...s.bookmarks, lessonId],
    }))
  }, [])

  const reset = useCallback(() => setState(seedState()), [])

  const value = useMemo(
    () => ({
      ...state,
      streak: computeStreak(state.activity),
      addXp,
      toggleBookmark,
      reset,
      toggleLesson: (lessonId: string) => {
        const wasDone = state.completedLessons.includes(lessonId)
        toggleLesson(lessonId)
        addXp(wasDone ? -LESSON_XP : LESSON_XP)
      },
    }),
    [state, addXp, toggleBookmark, reset, toggleLesson],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
