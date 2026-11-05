import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Card, PageHeader } from '../components/ui'
import { languages, overallScore } from '../data/languages'

const criteria = [
  { title: 'GDP access', desc: 'How much of the world economy you can reach with the language.' },
  { title: 'Trade utility', desc: 'How often it is used in imports, exports and supply chains.' },
  { title: 'Diplomatic weight', desc: 'Its role in governments and international institutions.' },
  { title: 'Wage premium', desc: 'The real salary boost it brings in labor markets.' },
]

export default function About() {
  return (
    <>
      <PageHeader
        title="Which language makes you the most money?"
        subtitle="Most people assume it is the language with the most native speakers. The job market tells a different story."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {criteria.map((c, i) => (
          <Card key={c.title} delay={i * 0.05}>
            <p className="font-semibold text-slate-900 dark:text-white">{c.title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.desc}</p>
          </Card>
        ))}
      </div>

      {/* Countdown from #5 to #1 */}
      <ol className="relative space-y-6 border-l-2 border-dashed border-slate-200 pl-6 sm:pl-8 dark:border-slate-800">
        {[...languages].reverse().map((l, i) => (
          <motion.li
            key={l.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="relative"
          >
            <span className={`absolute top-5 -left-[2.4rem] grid size-8 place-items-center rounded-full bg-gradient-to-br ${l.gradient} text-sm font-bold text-white shadow-md ring-4 ring-slate-50 sm:-left-[2.9rem] dark:ring-slate-950`}>
              {l.rank}
            </span>
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-4xl">{l.flag}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{l.name}</h2>
                  <p className={`text-sm font-medium ${l.accentText}`}>{l.tagline}</p>
                </div>
                <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold dark:bg-slate-800">{overallScore(l.scores)}/100</span>
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-300">{l.whyValuable}</p>
              <Link to={`/languages/${l.id}`} className={`mt-4 inline-block text-sm font-semibold ${l.accentText}`}>Start learning {l.name} →</Link>
            </Card>
          </motion.li>
        ))}
      </ol>
      <p className="mt-6 text-xs text-slate-400">Scores are illustrative and summarize the ranking from the Airlearn Language Show episode.</p>
    </>
  )
}
