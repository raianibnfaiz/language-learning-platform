import { Download, Printer } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Mascot } from '../components/fun'
import { PageHeader } from '../components/ui'
import { levelFor, usePhrasebook } from '../context/phrasebook'
import { dayKey, useProgress } from '../context/progress'
import { catalogSorted, getCatalogLanguage, type CatalogLanguage } from '../data/phrasebook/catalog'
import {
  activeLanguages, download, favoriteRows, phraseRows, progressRows, reportCsv, reportKinds, wordRows, type ReportKind,
} from '../data/phrasebook/reports'
import { lastNDays } from '../lib/dates'

const MINE = 'mine'

export default function Reports() {
  const pb = usePhrasebook()
  const { xp, streak, activity } = useProgress()
  const mine = activeLanguages(pb)
  const [scope, setScope] = useState<string>(mine.length ? MINE : (catalogSorted[0]?.id ?? 'english'))
  const [kind, setKind] = useState<ReportKind>('phrases')

  const langs: CatalogLanguage[] = scope === MINE ? mine : [getCatalogLanguage(scope)!].filter(Boolean)
  const scopeLabel = scope === MINE ? 'All my languages' : `${langs[0]?.flag} ${langs[0]?.name}`
  const meta = reportKinds.find((k) => k.id === kind)!
  const [generated] = useState(() => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }))

  const fileBase = `linguawealth-${kind}-${scope === MINE ? 'my-languages' : scope}`

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Reports" subtitle="Turn your learning into a printable study sheet or a spreadsheet, for any language." />

        <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="report-lang" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Language</label>
            <select
              id="report-lang"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800"
            >
              {mine.length > 0 && <option value={MINE}>🌍 All my languages ({mine.length})</option>}
              {mine.length > 0 && (
                <optgroup label="My languages">
                  {mine.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.name}</option>)}
                </optgroup>
              )}
              <optgroup label="Every language">
                {catalogSorted.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.name}</option>)}
              </optgroup>
            </select>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                onClick={() => download(`${fileBase}.csv`, reportCsv(kind, langs, pb))}
                disabled={!langs.length}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="size-4" /> Download CSV
              </button>
              <button
                onClick={() => window.print()}
                disabled={!langs.length}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-primary-700 disabled:opacity-40"
              >
                <Printer className="size-4" /> Print / save as PDF
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reportKinds.map((k) => (
              <motion.button
                key={k.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
                className={`rounded-2xl border-2 p-4 text-left transition ${kind === k.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-600/15' : 'border-slate-200 hover:border-primary-300 dark:border-slate-700'}`}
              >
                <span className="text-2xl">{k.emoji}</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{k.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.blurb}</p>
              </motion.button>
            ))}
          </div>
        </div>

        <p className="mt-6 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Preview</p>
      </div>

      {/* The report itself: a light "paper" sheet in both themes, and the only thing that prints */}
      <motion.article
        key={`${kind}-${scope}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="report-sheet rounded-3xl bg-white p-6 text-slate-800 shadow-sm ring-1 ring-slate-200 sm:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0"
      >
        <header className="flex items-start justify-between gap-4 border-b-2 border-primary-600 pb-4">
          <div>
            <p className="text-sm font-bold text-primary-700">Lingua<span className="text-primary-500">Wealth</span></p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">{meta.emoji} {meta.title}</h2>
            <p className="text-sm text-slate-500">{scopeLabel} · Raian · {generated}</p>
          </div>
          <Mascot size={64} mood="happy" className="print:hidden" />
        </header>

        {!langs.length ? (
          <Empty>Pick a language to build a report.</Empty>
        ) : kind === 'phrases' ? (
          <PhraseReport langs={langs} />
        ) : kind === 'words' ? (
          <WordReport langs={langs} />
        ) : kind === 'favorites' ? (
          <FavoritesReport langs={langs} />
        ) : (
          <ProgressReport langs={langs} xp={xp} streak={streak} activity={activity} />
        )}

        <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-400">
          Generated by LinguaWealth · Keep practising a little every day 🌱
        </footer>
      </motion.article>
    </>
  )
}

/* ---------- Building blocks ---------- */

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-slate-500">{children}</p>
}

function LangHeading({ lang, children }: { lang: CatalogLanguage; children?: ReactNode }) {
  return (
    <h3 className="mt-8 flex items-baseline gap-2 text-lg font-bold text-slate-900 break-after-avoid">
      <span className="text-2xl">{lang.flag}</span> {lang.name}
      <span className="text-sm font-normal text-slate-400">{lang.nativeName}</span>
      {children && <span className="ml-auto text-sm font-medium text-slate-500">{children}</span>}
    </h3>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="mt-2 w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-slate-300 text-xs tracking-wide text-slate-500 uppercase">
          {head.map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 break-inside-avoid even:bg-slate-50/60">
            {r.map((c, j) => <td key={j} className="py-2 pr-3 align-top">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const Native = ({ text, roman }: { text: string; roman?: string }) => (
  <>
    <span className="font-semibold text-slate-900" dir="auto">{text}</span>
    {roman && <span className="block text-xs text-slate-500 italic">{roman}</span>}
  </>
)

/* ---------- Report kinds ---------- */

function PhraseReport({ langs }: { langs: CatalogLanguage[] }) {
  const pb = usePhrasebook()
  const rows = phraseRows(langs, pb)
  return (
    <>
      <p className="mt-4 text-sm text-slate-500">✓ heard · ❤ favourite · 🧠 in your review queue</p>
      {langs.map((lang) => {
        const mine = rows.filter((r) => r.lang.id === lang.id)
        const situations = [...new Set(mine.map((r) => r.situation))]
        return (
          <section key={lang.id}>
            <LangHeading lang={lang}>{mine.filter((r) => r.heard).length}/{mine.length} heard</LangHeading>
            {situations.map((sit) => (
              <div key={sit} className="mt-3 break-inside-avoid">
                <p className="text-sm font-bold text-primary-700">{sit}</p>
                <Table
                  head={['Phrase', 'Meaning', '', 'My note']}
                  rows={mine.filter((r) => r.situation === sit).map((r) => [
                    <Native key="t" text={r.text} roman={r.romanization} />,
                    r.meaning,
                    <span key="s" className="whitespace-nowrap" title={r.review}>{r.heard ? '✓' : ''} {r.favorite ? '❤' : ''} {r.review ? '🧠' : ''}</span>,
                    <span key="n" className="text-slate-600">{r.note}</span>,
                  ])}
                />
              </div>
            ))}
          </section>
        )
      })}
    </>
  )
}

function WordReport({ langs }: { langs: CatalogLanguage[] }) {
  const pb = usePhrasebook()
  const rows = wordRows(langs, pb)
  return (
    <>
      <p className="mt-4 text-sm text-slate-500">Every word from the phrases you can learn, with the phrase it comes from. ★ marks words you saved.</p>
      {langs.map((lang) => {
        const mine = rows.filter((r) => r.lang.id === lang.id)
        return (
          <section key={lang.id}>
            <LangHeading lang={lang}>{mine.length} words</LangHeading>
            <Table
              head={['Word', 'Used in', 'Phrase meaning', '']}
              rows={mine.map((r) => [
                <span key="w" className="font-semibold text-slate-900" dir="auto">{r.word}</span>,
                <span key="e" dir="auto">{r.example}</span>,
                <span key="m" className="text-slate-600">{r.meaning}</span>,
                r.favorite ? '★' : '',
              ])}
            />
          </section>
        )
      })}
    </>
  )
}

function FavoritesReport({ langs }: { langs: CatalogLanguage[] }) {
  const pb = usePhrasebook()
  const fav = favoriteRows(langs, pb)
  if (!fav.phrases.length && !fav.words.length) {
    return <Empty>No favourites yet. Tap ❤ on a phrase or ☆ on a word in the phrase player to save it here.</Empty>
  }
  return (
    <>
      {langs.map((lang) => {
        const phrases = fav.phrases.filter((r) => r.lang.id === lang.id)
        const ws = fav.words.filter((r) => r.lang.id === lang.id)
        if (!phrases.length && !ws.length) return null
        return (
          <section key={lang.id}>
            <LangHeading lang={lang}>{phrases.length} phrase{phrases.length === 1 ? '' : 's'} · {ws.length} word{ws.length === 1 ? '' : 's'}</LangHeading>
            {phrases.length > 0 && (
              <>
                <p className="mt-3 text-sm font-bold text-rose-600">❤ Favourite phrases</p>
                <Table
                  head={['Phrase', 'Meaning', 'Situation', 'My note']}
                  rows={phrases.map((r) => [<Native key="t" text={r.text} roman={r.romanization} />, r.meaning, r.situation, r.note])}
                />
              </>
            )}
            {ws.length > 0 && (
              <>
                <p className="mt-4 text-sm font-bold text-amber-600">★ Favourite words</p>
                <Table
                  head={['Word', 'Used in', 'Phrase meaning']}
                  rows={ws.map((r) => [<span key="w" className="font-semibold text-slate-900" dir="auto">{r.word}</span>, <span key="e" dir="auto">{r.example}</span>, r.meaning])}
                />
              </>
            )}
          </section>
        )
      })}
    </>
  )
}

function ProgressReport({ langs, xp, streak, activity }: { langs: CatalogLanguage[]; xp: number; streak: number; activity: Record<string, number> }) {
  const pb = usePhrasebook()
  const rows = progressRows(langs, pb)
  const lvl = levelFor(xp)
  const days = lastNDays(14).map((d) => ({ label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), xp: activity[dayKey(d)] ?? 0 }))
  const maxXp = Math.max(50, ...days.map((d) => d.xp))
  const heard = rows.reduce((a, r) => a + r.heard, 0)
  const total = rows.reduce((a, r) => a + r.total, 0)

  const summary = [
    ['Level', lvl.level],
    ['Total XP', xp],
    ['Day streak', `${streak} 🔥`],
    ['Phrases heard', `${heard}/${total}`],
    ['Stars', `${rows.reduce((a, r) => a + r.stars, 0)}/${rows.reduce((a, r) => a + r.maxStars, 0)}`],
    ['In review', rows.reduce((a, r) => a + r.reviewCount, 0)],
  ]

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {summary.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
            <p className="text-lg font-black text-slate-900">{v}</p>
            <p className="text-xs text-slate-500">{k}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 break-inside-avoid">
        <p className="text-sm font-bold text-slate-700">XP over the last 14 days</p>
        <div className="mt-2 flex h-28 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-20 w-full items-end">
                <div className="w-full rounded-t bg-primary-500 print:bg-primary-600" style={{ height: `${Math.max(3, (d.xp / maxXp) * 100)}%` }} title={`${d.xp} XP`} />
              </div>
              <span className="text-[9px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {rows.map((r) => (
        <section key={r.lang.id} className="break-inside-avoid">
          <LangHeading lang={r.lang}>{r.pct}% heard</LangHeading>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${r.pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {r.heard}/{r.total} phrases heard · {r.stars}/{r.maxStars} stars · {r.reviewCount} in review ({r.needsPractice} need practice) · {r.favorites} favourites · {r.notes} notes
          </p>
          <Table
            head={['Situation', 'Heard', 'Picture match', 'Sharp ears', 'Word builder', 'Fill the gap']}
            rows={r.situations.map((x) => [
              `${x.emoji} ${x.title}`,
              `${x.heard}/${x.total}`,
              ...x.testStars.map((n, i) => <span key={i} className="tracking-tighter whitespace-nowrap">{'★'.repeat(n)}<span className="text-slate-300">{'★'.repeat(3 - n)}</span></span>),
            ])}
          />
        </section>
      ))}
    </>
  )
}
