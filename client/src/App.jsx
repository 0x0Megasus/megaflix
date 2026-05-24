import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SearchResults from './components/SearchResults'
import PlayerModal from './components/PlayerModal'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import DMCA from './pages/DMCA'
import NotFoundPage from './pages/NotFoundPage'
import { fetchBestContent, fetchContent } from './services/api'

export default function App() {
  const [playerItem, setPlayerItem] = useState(null)
  const [heroItem, setHeroItem] = useState(null)
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadHero = async () => {
      setHeroLoading(true)
      try {
        const best = await fetchBestContent('movies')
        if (cancelled) return
        if (Array.isArray(best) && best.length > 0) {
          setHeroItem(best[0])
          setHeroLoading(false)
          // BACKGROUND PRE-WARM: Start loading TV and Anime while user looks at hero
          fetchBestContent('tv', 10).catch(() => {})
          fetchBestContent('anime', 10).catch(() => {})
          return
        }

        const fallback = await fetchContent('movies', '', 1)
        if (cancelled) return
        if (Array.isArray(fallback) && fallback.length > 0) {
          setHeroItem(fallback[0])
        }
      } catch (err) {
        if (cancelled) return
        // Final fallback try
        try {
          const data = await fetchContent('movies', '', 1)
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setHeroItem(data[0])
          }
        } catch { /* ignore */ }
      } finally {
        if (!cancelled) setHeroLoading(false)
      }
    }
    loadHero()
    return () => { cancelled = true }
  }, [])

  const openPlayer = useCallback((item) => setPlayerItem(item), [])
  const closePlayer = useCallback(() => setPlayerItem(null), [])

  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage onWatch={openPlayer} heroItem={heroItem} heroLoading={heroLoading} />} />
        <Route path="/movies" element={<CategoryPage filter="movies" label="Movies" onWatch={openPlayer} />} />
        <Route path="/tv" element={<CategoryPage filter="tv" label="TV Shows" onWatch={openPlayer} />} />
        <Route path="/anime" element={<CategoryPage filter="anime" label="Anime" onWatch={openPlayer} />} />
        <Route path="/search" element={<SearchResults onWatch={openPlayer} />} />
        <Route path="/dmca" element={<DMCA />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
      {playerItem && (
        <PlayerModal item={playerItem} onClose={closePlayer} />
      )}
    </div>
  )
}
