/** Text helpers for the phrasebook tests: shuffling, splitting phrases and forgiving comparisons */

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Up to `n` random items from `pool` that are not `exclude` */
export const sample = <T,>(pool: T[], n: number, exclude?: T) => shuffle(pool.filter((p) => p !== exclude)).slice(0, n)

/** User-perceived characters, so accents and combining marks stay attached */
export function graphemes(text: string, locale?: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
  }
  return Array.from(text)
}

/** Words of a phrase without punctuation. Handles languages written without spaces (Chinese, Thai…). */
export function words(text: string, locale?: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segs = Array.from(new Intl.Segmenter(locale, { granularity: 'word' }).segment(text))
    return segs.filter((s) => s.isWordLike).map((s) => s.segment)
  }
  return text.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{M}\p{N}'’-]/gu, '')).filter(Boolean)
}

/** Lowercase, strip accents and punctuation so small slips still count */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** 0..1 similarity between two strings (Levenshtein based, after normalizing) */
export function similarity(a: string, b: string) {
  const x = normalize(a)
  const y = normalize(b)
  if (!x && !y) return 1
  const prev = Array.from({ length: y.length + 1 }, (_, i) => i)
  for (let i = 1; i <= x.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= y.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (x[i - 1] === y[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length)
}
