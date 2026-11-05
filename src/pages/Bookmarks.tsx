import { BookmarkX, Clock } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Card, LevelBadge, PageHeader } from '../components/ui'
import { useProgress } from '../context/progress'
import { languages } from '../data/languages'

export default function Bookmarks() {
  const { bookmarks, toggleBookmark } = useProgress()
  const saved = languages.flatMap((lang) => lang.lessons.filter((l) => bookmarks.includes(l.id)).map((lesson) => ({ lang, lesson })))

  return (
    <>
      <PageHeader title="Bookmarks" subtitle="Lessons you saved for later." />
      {saved.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-4xl">🔖</p>
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">No bookmarks yet</p>
          <p className="mt-1 text-sm text-slate-500">Tap the bookmark icon on any lesson to save it here.</p>
          <Link to="/languages" className="mt-5 inline-block rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Browse languages</Link>
        </Card>
      ) : (
        <motion.ul layout className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {saved.map(({ lang, lesson }) => (
              <motion.li key={lesson.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Card className="flex items-center gap-4">
                  <span className="text-3xl">{lang.flag}</span>
                  <Link to={`/languages/${lang.id}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 hover:text-primary-600 dark:text-white">{lesson.title}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{lesson.description}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <LevelBadge level={lesson.level} />
                      <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="size-3.5" />{lesson.minutes}m</span>
                    </div>
                  </Link>
                  <button onClick={() => toggleBookmark(lesson.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Remove bookmark">
                    <BookmarkX className="size-5" />
                  </button>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  )
}
