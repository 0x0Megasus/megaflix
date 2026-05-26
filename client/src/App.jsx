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
        const [tv, anime] = await Promise.all([
          fetchBestContent('tv', 1),
          fetchBestContent('anime', 1),
        ])
        if (cancelled) return

        const best = tv?.[0] || anime?.[0]
        if (best) {
          setHeroItem(best)
          setHeroLoading(false)
          fetchBestContent('tv', 10).catch(() => {})
          fetchBestContent('anime', 10).catch(() => {})
          return
        }
      } catch {
        // No TV/anime content available — hero stays hidden
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
