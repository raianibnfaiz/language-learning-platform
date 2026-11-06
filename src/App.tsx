import { AnimatePresence } from 'motion/react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import HelpBot from './components/HelpBot'
import PageTransition from './components/PageTransition'
import Sidebar from './components/Sidebar'
import { PhrasebookProvider } from './context/PhrasebookProvider'
import { ProgressProvider } from './context/ProgressProvider'
import { useTheme } from './context/theme'
import About from './pages/About'
import Bookmarks from './pages/Bookmarks'
import Dashboard from './pages/Dashboard'
import LanguageDetail from './pages/LanguageDetail'
import Languages from './pages/Languages'
import NotFound from './pages/NotFound'
import Practice from './pages/Practice'
import Progress from './pages/Progress'

// The phrasebook carries 54 languages of content, so it loads on demand
const PhrasebookHome = lazy(() => import('./pages/phrasebook/PhrasebookHome'))
const LanguageHub = lazy(() => import('./pages/phrasebook/LanguageHub'))
const SituationPage = lazy(() => import('./pages/phrasebook/SituationPage'))
const Review = lazy(() => import('./pages/phrasebook/Review'))
const Reports = lazy(() => import('./pages/Reports'))

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/languages', element: <Languages /> },
  { path: '/languages/:id', element: <LanguageDetail /> },
  { path: '/phrasebook', element: <PhrasebookHome /> },
  { path: '/phrasebook/:langId', element: <LanguageHub /> },
  { path: '/phrasebook/:langId/:situationId', element: <SituationPage /> },
  { path: '/review', element: <Review /> },
  { path: '/reports', element: <Reports /> },
  { path: '/practice', element: <Practice /> },
  { path: '/progress', element: <Progress /> },
  { path: '/bookmarks', element: <Bookmarks /> },
  { path: '/about', element: <About /> },
  { path: '*', element: <NotFound /> },
]

export default function App() {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <ProgressProvider>
      <PhrasebookProvider>
      <div className="min-h-screen">
        <Header theme={theme} onToggleTheme={toggle} onOpenMenu={() => setMenuOpen(true)} />
        <div className="flex">
          <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8 print:max-w-none print:p-0">
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {routes.map((r) => (
                    <Route key={r.path} path={r.path} element={<PageTransition><Suspense fallback={<div className="grid h-64 place-items-center text-4xl"><span className="animate-bounce">🌱</span></div>}>{r.element}</Suspense></PageTransition>} />
                  ))}
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </div>
        <HelpBot />
      </div>
      </PhrasebookProvider>
    </ProgressProvider>
  )
}
