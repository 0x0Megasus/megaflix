import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import HeroBanner from '../components/HeroBanner'
import TopRatedRow from '../components/TopRatedRow'

export default function HomePage({ onWatch, heroItem, heroLoading }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <main className="home-page">
      <SEO description="Browse and stream free movies, TV shows, and anime in HD." />
      <HeroBanner item={heroItem} onWatch={onWatch} loading={heroLoading} />
      <section className="home-page__rows">
        <TopRatedRow title="Top Movies" filter="movies" onWatch={onWatch} limit={10} />
        <TopRatedRow title="TV Shows" filter="tv" onWatch={onWatch} limit={10} />
        <TopRatedRow title="Anime" filter="anime" onWatch={onWatch} limit={10} />
      </section>

      <div className="row__bottom-search">
        <form onSubmit={handleSearch} className="bottom-search-form">
          <input
            className="bottom-search-input"
            type="text"
            placeholder="Search movies, TV shows & anime..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="bottom-search-btn" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button type="button" className="bottom-search-adv" onClick={() => navigate('/search')}>
            Advanced Search
          </button>
        </form>
      </div>
    </main>
  )
}
