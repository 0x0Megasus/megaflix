import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SearchResults from './components/SearchResults'
import PlayerModal from './components/PlayerModal'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSkeleton from './components/LoadingSkeleton'
import { fetchContent, fetchBestContent } from './services/api'
import { getCategoryIds } from './services/utils'

const HomePage = lazy(() => import('./pages/HomePage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const DMCA = lazy(() => import('./pages/DMCA'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageFallback() {
  return (
    <main className="home-page">
      <LoadingSkeleton title="" count={6} />
    </main>
  )
}

export default function App() {
  const [playerItem, setPlayerItem] = useState(null)
  const [heroItem, setHeroItem] = useState(null)
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setHeroLoading(true)
      try {
        const [tvContent] = await Promise.all([
          fetchContent('tv', '', 1),
        ])
        if (cancelled) return
        const hero = Array.isArray(tvContent)
          ? tvContent.find(i => !getCategoryIds(i).some(c => [5, 8].includes(c))) || tvContent[0]
          : null
        setHeroItem(hero)
      } catch {
        // Content unavailable — UI handles empty state
      } finally {
        if (!cancelled) setHeroLoading(false)
      }

      // Background cache-warm: fetch best-content for next page load
      fetchBestContent('movies', 10).catch(() => {})
      fetchBestContent('tv', 10).catch(() => {})
      fetchBestContent('anime', 10).catch(() => {})
    }
    load()
    return () => { cancelled = true }
  }, [])

  const openPlayer = useCallback((item) => setPlayerItem(item), [])
  const closePlayer = useCallback(() => setPlayerItem(null), [])

  return (
    <div className="app">
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage onWatch={openPlayer} heroItem={heroItem} heroLoading={heroLoading} />} />
            <Route path="/movies" element={<ErrorBoundary><CategoryPage filter="movies" label="Movies" onWatch={openPlayer} /></ErrorBoundary>} />
            <Route path="/tv" element={<ErrorBoundary><CategoryPage filter="tv" label="TV Shows" onWatch={openPlayer} /></ErrorBoundary>} />
            <Route path="/anime" element={<ErrorBoundary><CategoryPage filter="anime" label="Anime" onWatch={openPlayer} /></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary><SearchResults onWatch={openPlayer} /></ErrorBoundary>} />
            <Route path="/dmca" element={<ErrorBoundary><DMCA /></ErrorBoundary>} />
            <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Footer />
      {playerItem && <PlayerModal item={playerItem} onClose={closePlayer} />}
    </div>
  )
}
