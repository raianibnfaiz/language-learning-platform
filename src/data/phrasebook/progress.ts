import { phraseKey, starKey } from '../../context/phrasebook'
import { catalog } from './catalog'
import { phrasesFor, situations as situationsList, situationsFor } from './phrases'

import { tests } from './tests'

export const TESTS_PER_SITUATION = tests.length

/** How many phrases a language offers, and how many of them the learner has heard */
export function languageProgress(langId: string, heard: string[]) {
  const ids = situationsFor(langId)
    .filter((s) => s.available)
    .flatMap((s) => phrasesFor(langId, s.id).map((p) => phraseKey(langId, p.id)))
  const done = ids.filter((k) => heard.includes(k)).length
  return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 }
}

/** Heard phrases and stars earned for one situation */
export function situationProgress(langId: string, situationId: string, heard: string[], stars: Record<string, number>) {
  const phrases = phrasesFor(langId, situationId)
  const heardCount = phrases.filter((p) => heard.includes(phraseKey(langId, p.id))).length
  const testStars = Array.from({ length: TESTS_PER_SITUATION }, (_, i) => stars[starKey(langId, situationId, i + 1)] ?? 0)
  return {
    heard: heardCount,
    total: phrases.length,
    testStars,
    stars: testStars.reduce((a, b) => a + b, 0),
    maxStars: TESTS_PER_SITUATION * 3,
  }
}

/** Totals across the whole catalog, computed once */
export const phrasebookTotals = (() => {
  let phrases = 0
  let situations = 0
  for (const l of catalog) {
    for (const s of situationsFor(l.id)) {
      if (!s.available) continue
      situations++
      phrases += s.phrases.length
    }
  }
  return { languages: catalog.length, phrases, situations, topics: situationsList.length }
})()

/** The next situation worth opening in a language: the first one not fully starred */
export function nextSituation(langId: string, heard: string[], stars: Record<string, number>) {
  const open = situationsFor(langId).filter((s) => s.available)
  return open.find((s) => situationProgress(langId, s.id, heard, stars).stars < TESTS_PER_SITUATION * 3) ?? open[0]
}
