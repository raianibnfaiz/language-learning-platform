import { createContext, useContext } from 'react'

/** Days until the next review for each Leitner box. Box 6 means mastered. */
export const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30]
export const MASTERED_BOX = REVIEW_INTERVALS.length

export interface ReviewCard {
  /** Leitner box, 0 = needs work now */
  box: number
  /** YYYY-MM-DD when the card is next due */
  due: string
}

export interface PhrasebookState {
  /** `${langId}:${phraseId}` the learner has listened to */
  heard: string[]
  /** Personal notes per phrase key */
  notes: Record<string, string>
  /** Best stars (0-3) per `${langId}:${situationId}:${test}` */
  stars: Record<string, number>
  /** Spaced-repetition queue per phrase key */
  review: Record<string, ReviewCard>
  /** Recently opened language ids, newest first */
  recent: string[]
}

export interface PhrasebookContextValue extends PhrasebookState {
  /** Phrase keys due today or earlier */
  due: string[]
  markHeard: (key: string) => boolean
  setNote: (key: string, note: string) => void
  recordTest: (langId: string, situationId: string, test: number, stars: number, missed: string[]) => void
  addToReview: (keys: string[]) => void
  answerReview: (key: string, knewIt: boolean) => void
  visitLanguage: (langId: string) => void
}

export const PhrasebookContext = createContext<PhrasebookContextValue | null>(null)

export function usePhrasebook() {
  const ctx = useContext(PhrasebookContext)
  if (!ctx) throw new Error('usePhrasebook must be used inside PhrasebookProvider')
  return ctx
}

export const phraseKey = (langId: string, phraseId: string) => `${langId}:${phraseId}`
export const starKey = (langId: string, situationId: string, test: number) => `${langId}:${situationId}:${test}`

/** Stars for a test score: 3 for perfect, 2 for 70%+, 1 for 50%+ (enough to unlock the next test) */
export function starsFor(correct: number, total: number) {
  const pct = total ? correct / total : 0
  if (pct >= 1) return 3
  if (pct >= 0.7) return 2
  if (pct >= 0.5) return 1
  return 0
}

/** Level from total XP: each level needs a bit more than the last */
export function levelFor(xp: number) {
  let level = 1
  let need = 100
  let left = xp
  while (left >= need) {
    left -= need
    level++
    need += 50
  }
  return { level, into: left, need }
}
