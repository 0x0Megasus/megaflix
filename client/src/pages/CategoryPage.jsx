import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import HeroBanner from '../components/HeroBanner'
import ContentCard from '../components/ContentCard'
import ShowCard from '../components/ShowCard'
import TopRatedRow from '../components/TopRatedRow'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { fetchBestContent, fetchContent, fetchPosts, clearCache } from '../services/api'
import { groupByShow, pickBiggestSeason, getCategoryIds, detectType, showKey } from '../services/utils'

const PAGE_SIZE = 10

export default function CategoryPage({ filter, onWatch }) {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [heroItem, setHeroItem] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    clearCache()
    let cancelled = false
    setLoading(true)
    setItems(null)
    setHeroItem(null)
    setVisibleCount(PAGE_SIZE)

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

    if (filter === 'tv' || filter === 'anime') {
      fetchBestContent(filter, 1).then(best => {
        if (!cancelled && best?.[0]) setHeroItem(best[0])
      }).catch(() => {})
    }

    return () => { cancelled = true }
  }, [filter])

  const catLabel = filter === 'movies' ? 'Movies' : filter === 'tv' ? 'TV Shows' : 'Anime'
  const isShowType = filter === 'tv' || filter === 'anime'

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${filter}`)
  }

  const handleLoadMore = async () => {
    if (visibleCount < displayItems.length) {
      setVisibleCount(prev => prev + PAGE_SIZE)
      return
    }
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = Math.floor((items?.length || 0) / 50) + 1
    const more = await fetchPosts({ filter, page: nextPage, perPage: 50 }).catch(() => [])
    if (Array.isArray(more) && more.length > 0) {
      setItems(prev => {
        const seen = new Set((prev || []).map(p => p.id))
        const fresh = more.filter(p => !seen.has(p.id))
        return [...(prev || []), ...fresh]
      })
    }
    setLoadingMore(false)
  }

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

  const catHero = heroItem || (Array.isArray(items) && items.find(i => {
    const cats = getCategoryIds(i)
    if (filter === 'anime') return cats.some(c => [5, 8].includes(c)) && !cats.some(c => [7, 9].includes(c))
    if (filter === 'tv') return cats.some(c => [7, 9].includes(c)) && !cats.some(c => [5, 8].includes(c)) && !cats.some(c => [3, 4].includes(c))
    if (filter === 'movies') return cats.some(c => [3, 4].includes(c)) && !cats.some(c => [7, 9].includes(c))
    return false
  })) || items?.[0] || null

  const displayItems = isShowType 
    ? groupByShow(items).map(g => {
        const season = pickBiggestSeason(g)
        const sNum = season.seasonNum || 1
        if (Object.keys(g.seasons).length === 0) {
          g.seasons[sNum] = g.posts
        }
        return { ...g, ...season }
      }).filter((item, idx, arr) => {
        const key = showKey(item.displayName || '')
        return key && arr.findIndex(x => showKey(x.displayName || '') === key) === idx
      })
    : items || []


  const visibleItems = displayItems.slice(0, visibleCount)
  const hasMore = visibleCount < displayItems.length
  const canFetchMore = !hasMore && items?.length >= 100

  const handleSearchBtn = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    navigate(`/search?type=${filter}`)
  }

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
            <span className="row__count">{displayItems.length} items</span>
          </div>
          <div className="row__grid">
            {visibleItems.length === 0 ? (
              <p className="row__empty">No {catLabel.toLowerCase()} available</p>
            ) : (
              visibleItems.map((g, i) => {
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

          {(hasMore || canFetchMore) && (
            <div className="load-more-wrap">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>Loading...</>
                ) : canFetchMore ? (
                  <>Load More from Page {(Math.floor((items?.length || 0) / 50) + 1)}</>
                ) : (
                  <>Load More ({displayItems.length - visibleCount} remaining)</>
                )}
              </button>
              {!hasMore && !canFetchMore && displayItems.length > 0 && (
                <p className="load-more-end">You&apos;ve seen all {catLabel.toLowerCase()}</p>
              )}
            </div>
          )}

          <div className="row__bottom-search">
            <form onSubmit={handleSearch} className="bottom-search-form">
              <input
                className="bottom-search-input"
                type="text"
                placeholder={`Search ${catLabel}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="bottom-search-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <button type="button" className="bottom-search-adv" onClick={handleSearchBtn}>
                Advanced Search
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
