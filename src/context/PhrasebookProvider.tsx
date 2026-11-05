import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MASTERED_BOX, PhrasebookContext, REVIEW_INTERVALS, starKey, type PhrasebookState } from './phrasebook'
import { dayKey, todayKey } from './progress'

const STORAGE_KEY = 'linguawealth.phrasebook'

const empty: PhrasebookState = { heard: [], notes: {}, stars: {}, review: {}, recent: [] }

function load(): PhrasebookState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...empty, ...(JSON.parse(raw) as Partial<PhrasebookState>) }
  } catch {
    // ignore corrupt storage and start fresh
  }
  return empty
}

const daysFromNow = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return dayKey(d)
}

export function PhrasebookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PhrasebookState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const markHeard = useCallback(
    (key: string) => {
      if (state.heard.includes(key)) return false
      setState((s) => (s.heard.includes(key) ? s : { ...s, heard: [...s.heard, key] }))
      return true
    },
    [state.heard],
  )

  const setNote = useCallback((key: string, note: string) => {
    setState((s) => {
      const notes = { ...s.notes }
      if (note.trim()) notes[key] = note
      else delete notes[key]
      return { ...s, notes }
    })
  }, [])

  const addToReview = useCallback((keys: string[]) => {
    if (!keys.length) return
    setState((s) => {
      const review = { ...s.review }
      for (const k of keys) review[k] = { box: 0, due: todayKey() }
      return { ...s, review }
    })
  }, [])

  const recordTest = useCallback(
    (langId: string, situationId: string, test: number, stars: number, missed: string[]) => {
      setState((s) => {
        const key = starKey(langId, situationId, test)
        const review = { ...s.review }
        for (const k of missed) review[k] = { box: 0, due: todayKey() }
        return { ...s, review, stars: { ...s.stars, [key]: Math.max(s.stars[key] ?? 0, stars) } }
      })
    },
    [],
  )

  const answerReview = useCallback((key: string, knewIt: boolean) => {
    setState((s) => {
      const card = s.review[key]
      if (!card) return s
      const review = { ...s.review }
      const box = knewIt ? card.box + 1 : 0
      if (box >= MASTERED_BOX) delete review[key]
      else review[key] = { box, due: daysFromNow(REVIEW_INTERVALS[box]) }
      return { ...s, review }
    })
  }, [])

  const visitLanguage = useCallback((langId: string) => {
    setState((s) => (s.recent[0] === langId ? s : { ...s, recent: [langId, ...s.recent.filter((id) => id !== langId)].slice(0, 6) }))
  }, [])

  const value = useMemo(() => {
    const today = todayKey()
    const due = Object.entries(state.review)
      .filter(([, c]) => c.due <= today)
      .map(([k]) => k)
    return { ...state, due, markHeard, setNote, recordTest, addToReview, answerReview, visitLanguage }
  }, [state, markHeard, setNote, recordTest, addToReview, answerReview, visitLanguage])

  return <PhrasebookContext.Provider value={value}>{children}</PhrasebookContext.Provider>
}
