import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import HeroBanner from '../components/HeroBanner'
import ContentCard from '../components/ContentCard'
import ShowCard from '../components/ShowCard'
import TopRatedRow from '../components/TopRatedRow'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { fetchBestContent, fetchContent } from '../services/api'
import { groupByShow, pickBiggestSeason, detectType } from '../services/utils'

export default function CategoryPage({ filter, onWatch }) {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setItems(null)

    async function load() {
      try {
        const data = await fetchContent(filter)
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch {
        if (!cancelled) { setItems([]); setLoading(false) }
      }
    }

    load()
    return () => { cancelled = true }
  }, [filter])

  const catLabel = filter === 'movies' ? 'Movies' : filter === 'tv' ? 'TV Shows' : 'Anime'
  const isShowType = filter === 'tv' || filter === 'anime'

  if (loading) {
    return (
      <main className="category-page">
        <SEO title={catLabel} description={`Browse and stream free ${catLabel.toLowerCase()} online in HD.`} path={`/${filter}`} />
        <HeroBanner loading={true} onWatch={onWatch} />
        <LoadingSkeleton title={`Top ${catLabel}`} count={10} grid={true} />
        <LoadingSkeleton title={`More ${catLabel}`} count={10} grid={true} />
      </main>
    )
  }

  const catHero = items?.[0] || null

  const displayItems = isShowType 
    ? groupByShow(items).map(g => {
        const season = pickBiggestSeason(g)
        const sNum = season.seasonNum || 1
        // Ensure at least one season exists
        if (Object.keys(g.seasons).length === 0) {
          g.seasons[sNum] = g.posts
        }
        return { ...g, ...season }
      })
    : items || []

  // Limit "More X" items to 10
  const moreItems = displayItems.slice(0, 10)

  return (
    <main className="category-page">
      <SEO title={catLabel} description={`Browse and stream free ${catLabel.toLowerCase()} online in HD.`} path={`/${filter}`} />
      {catHero && <HeroBanner item={catHero} onWatch={onWatch} />}
      
      <section className="category-page__content">
        <TopRatedRow 
          title={`🎬 Top ${catLabel}`} 
          filter={filter} 
          onWatch={onWatch} 
          limit={10} 
        />

        <div className="row">
          <div className="row__header">
            <h2 className="row__title">More {catLabel}</h2>
          </div>
          <div className="row__grid">
            {moreItems.length === 0 ? (
              <p className="row__empty">No {catLabel.toLowerCase()} available</p>
            ) : (
              moreItems.map((g, i) => {
                const item = g.representative || g
                const type = detectType(item)
                const key = item.id ? `item-${item.id}` : `group-${g.displayName || i}`

                if (type === 'TV Show' || type === 'Anime') {
                  return <ShowCard key={key} group={g} onWatch={onWatch} />
                }
                return <ContentCard key={key} item={item} onWatch={onWatch} />
              })
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
