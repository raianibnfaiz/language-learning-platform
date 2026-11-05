import { phraseKey, type PhrasebookState } from '../../context/phrasebook'
import { words } from '../../lib/text'
import { catalog, getCatalogLanguage, type CatalogLanguage } from './catalog'
import { phrasesFor, situationsFor } from './phrases'
import { languageProgress, situationProgress } from './progress'

export type ReportKind = 'phrases' | 'words' | 'favorites' | 'progress'

export const reportKinds: { id: ReportKind; title: string; emoji: string; blurb: string }[] = [
  { id: 'phrases', title: 'Phrase list', emoji: '📜', blurb: 'Every phrase with its meaning, your notes and status.' },
  { id: 'words', title: 'Word list', emoji: '🔤', blurb: 'Each word found in the phrases, with an example.' },
  { id: 'favorites', title: 'Favourites', emoji: '❤️', blurb: 'The phrases and words you saved.' },
  { id: 'progress', title: 'Learning progress', emoji: '📈', blurb: 'Phrases heard, stars per test and review status.' },
]

export interface PhraseRow {
  lang: CatalogLanguage
  situation: string
  text: string
  romanization?: string
  meaning: string
  heard: boolean
  favorite: boolean
  review: string
  note: string
}

export interface WordRow {
  lang: CatalogLanguage
  word: string
  example: string
  meaning: string
  favorite: boolean
}

const reviewLabel = (box: number | undefined) => (box === undefined ? '' : box === 0 ? 'Needs practice' : `Learning (${box}/6)`)

/** Languages the learner has touched in any way */
export function activeLanguages(s: PhrasebookState) {
  const ids = new Set<string>(s.recent)
  const add = (k: string) => ids.add(k.split(':')[0])
  ;[...s.heard, ...s.favorites, ...s.favoriteWords, ...Object.keys(s.review), ...Object.keys(s.stars), ...Object.keys(s.notes)].forEach(add)
  return catalog.filter((l) => ids.has(l.id))
}

export function phraseRows(langs: CatalogLanguage[], s: PhrasebookState): PhraseRow[] {
  return langs.flatMap((lang) =>
    situationsFor(lang.id)
      .filter((sit) => sit.available)
      .flatMap((sit) =>
        phrasesFor(lang.id, sit.id).map((p) => {
          const key = phraseKey(lang.id, p.id)
          return {
            lang,
            situation: sit.title,
            text: p.text,
            romanization: p.romanization,
            meaning: p.meaning,
            heard: s.heard.includes(key),
            favorite: s.favorites.includes(key),
            review: reviewLabel(s.review[key]?.box),
            note: s.notes[key] ?? '',
          }
        }),
      ),
  )
}

export function wordRows(langs: CatalogLanguage[], s: PhrasebookState): WordRow[] {
  const rows: WordRow[] = []
  for (const lang of langs) {
    const seen = new Set<string>()
    for (const p of phraseRows([lang], s)) {
      for (const w of words(p.text, lang.speechCode)) {
        const id = w.toLocaleLowerCase(lang.speechCode)
        if (seen.has(id)) continue
        seen.add(id)
        rows.push({ lang, word: w, example: p.text, meaning: p.meaning, favorite: s.favoriteWords.includes(`${lang.id}:${w}`) })
      }
    }
  }
  return rows
}

export function favoriteRows(langs: CatalogLanguage[], s: PhrasebookState) {
  const ids = new Set(langs.map((l) => l.id))
  const phrases = phraseRows(langs, s).filter((r) => r.favorite)
  // Saved words keep the phrase they came from as an example when it can still be found
  const allWords = wordRows(langs, s)
  const wordsSaved = s.favoriteWords
    .filter((k) => ids.has(k.split(':')[0]))
    .map((k) => {
      const [langId, ...rest] = k.split(':')
      const word = rest.join(':')
      const lang = getCatalogLanguage(langId)!
      return allWords.find((w) => w.lang.id === langId && w.word === word) ?? { lang, word, example: '', meaning: '', favorite: true }
    })
  return { phrases, words: wordsSaved }
}

export function progressRows(langs: CatalogLanguage[], s: PhrasebookState) {
  return langs.map((lang) => {
    const overall = languageProgress(lang.id, s.heard)
    const situations = situationsFor(lang.id)
      .filter((sit) => sit.available)
      .map((sit) => ({ title: sit.title, emoji: sit.emoji, ...situationProgress(lang.id, sit.id, s.heard, s.stars) }))
    const reviewCards = Object.entries(s.review).filter(([k]) => k.startsWith(`${lang.id}:`))
    return {
      lang,
      heard: overall.done,
      total: overall.total,
      pct: overall.pct,
      stars: situations.reduce((a, x) => a + x.stars, 0),
      maxStars: situations.reduce((a, x) => a + x.maxStars, 0),
      situations,
      reviewCount: reviewCards.length,
      needsPractice: reviewCards.filter(([, c]) => c.box === 0).length,
      favorites: s.favorites.filter((k) => k.startsWith(`${lang.id}:`)).length,
      notes: Object.keys(s.notes).filter((k) => k.startsWith(`${lang.id}:`)).length,
    }
  })
}

/* ---------- CSV ---------- */

const cell = (v: string | number | boolean) => {
  const t = typeof v === 'boolean' ? (v ? 'yes' : '') : String(v)
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export const toCsv = (rows: (string | number | boolean)[][]) => rows.map((r) => r.map(cell).join(',')).join('\n')

export function reportCsv(kind: ReportKind, langs: CatalogLanguage[], s: PhrasebookState) {
  if (kind === 'phrases') {
    return toCsv([
      ['Language', 'Situation', 'Phrase', 'Pronunciation', 'Meaning', 'Heard', 'Favourite', 'Review', 'Note'],
      ...phraseRows(langs, s).map((r) => [r.lang.name, r.situation, r.text, r.romanization ?? '', r.meaning, r.heard, r.favorite, r.review, r.note]),
    ])
  }
  if (kind === 'words') {
    return toCsv([
      ['Language', 'Word', 'Example phrase', 'Phrase meaning', 'Favourite'],
      ...wordRows(langs, s).map((r) => [r.lang.name, r.word, r.example, r.meaning, r.favorite]),
    ])
  }
  if (kind === 'favorites') {
    const f = favoriteRows(langs, s)
    return toCsv([
      ['Type', 'Language', 'Text', 'Pronunciation', 'Meaning', 'Note'],
      ...f.phrases.map((r) => ['Phrase', r.lang.name, r.text, r.romanization ?? '', r.meaning, r.note]),
      ...f.words.map((r) => ['Word', r.lang.name, r.word, '', r.example ? `from “${r.example}” (${r.meaning})` : '', '']),
    ])
  }
  return toCsv([
    ['Language', 'Situation', 'Phrases heard', 'Phrases total', 'Test 1 stars', 'Test 2 stars', 'Test 3 stars', 'Test 4 stars'],
    ...progressRows(langs, s).flatMap((p) => p.situations.map((x) => [p.lang.name, x.title, x.heard, x.total, ...x.testStars])),
  ])
}

/** Save text as a file in the browser */
export function download(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  // The BOM makes Excel open UTF-8 (accents, Arabic, Chinese…) correctly
  const blob = new Blob(['﻿', text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
