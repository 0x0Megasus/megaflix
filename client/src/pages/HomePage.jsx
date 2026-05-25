import SEO from '../components/SEO'
import HeroBanner from '../components/HeroBanner'
import TopRatedRow from '../components/TopRatedRow'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function HomePage({ onWatch, heroItem, heroLoading }) {
  if (heroLoading) {
    return (
      <main className="home-page">
        <SEO description="Browse and stream free movies, TV shows, and anime in HD." />
        <HeroBanner loading={true} onWatch={onWatch} />
        <section className="home-page__rows">
          <LoadingSkeleton title="Top Movies" count={6} />
          <LoadingSkeleton title="Top TV Shows" count={6} />
          <LoadingSkeleton title="Top Anime" count={6} />
        </section>
      </main>
    )
  }

  return (
    <main className="home-page">
      <SEO description="Browse and stream free movies, TV shows, and anime in HD." />
      <HeroBanner item={heroItem} onWatch={onWatch} loading={heroLoading} />
      <section className="home-page__rows">
        <TopRatedRow title="🎬 Top Movies" filter="movies" onWatch={onWatch} limit={10} />
        <TopRatedRow title="📺 TV Shows" filter="tv" onWatch={onWatch} limit={10} />
        <TopRatedRow title="✨ Anime" filter="anime" onWatch={onWatch} limit={10} />
      </section>
    </main>
  )
}
