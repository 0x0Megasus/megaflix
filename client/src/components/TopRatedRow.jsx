import { useState, useEffect, useRef } from 'react'
import { fetchBestContent, fetchContent } from '../services/api'
import { getCleanTitle, getCategoryIds, detectType } from '../services/utils'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'
import ContentCard from './ContentCard'
import ShowCard from './ShowCard'

export default function TopRatedRow({ title, type, filter, onWatch, items: externalItems, limit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { containerRef, showArrows, scroll } = useHorizontalScroll([items])

  useEffect(() => {
    if (externalItems) {
      setItems(externalItems)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    async function loadTopRated() {
      const isShowType = (type || filter) === 'tv' || (type || filter) === 'anime'

      try {
        const [bestData, fallbackData] = await Promise.all([
          fetchBestContent(type || filter, limit).catch(() => []),
          filter ? fetchContent(filter, '', 1).catch(() => []) : Promise.resolve([])
        ]);

        let combined = [...(Array.isArray(bestData) ? bestData : [])];

        if (combined.length < (limit || 10) && Array.isArray(fallbackData)) {
          const seenIds = new Set(combined.map(i => i.id));
          const fill = fallbackData.filter(i => !seenIds.has(i.id));
          combined = [...combined, ...fill];
        }

        if (!cancelled) {
          let finalData = combined.slice(0, limit || 10)

          if (filter === 'anime') {
            finalData = finalData.filter(item => {
              const cats = getCategoryIds(item)
              return cats.some(c => [5, 8].includes(c)) && !cats.some(c => [7, 9].includes(c))
            })
          } else if (filter === 'tv') {
            finalData = finalData.filter(item => {
              const cats = getCategoryIds(item)
              return cats.some(c => [7, 9].includes(c)) && !cats.some(c => [5, 8].includes(c)) && !cats.some(c => [3, 4].includes(c))
            })
          } else if (filter === 'movies') {
            finalData = finalData.filter(item => {
              const cats = getCategoryIds(item)
              return cats.some(c => [3, 4].includes(c)) && !cats.some(c => [7, 9].includes(c))
            })
          }

          setItems(finalData)
          setLoading(false)
        }
      } catch {
        if (!cancelled) { setItems([]); setLoading(false) }
      }
    }

    loadTopRated()
    return () => { cancelled = true }
  }, [type, filter, externalItems, limit])

  const displayItems = limit ? (externalItems || items).slice(0, limit) : (externalItems || items)
  const displayLoading = loading && !externalItems

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        {showArrows && (
          <div className="row__arrows">
            <button className="row__arrow" onClick={() => scroll('left')} aria-label="Scroll left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <button className="row__arrow" onClick={() => scroll('right')} aria-label="Scroll right">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          </div>
        )}
      </div>
      {displayLoading ? (
        <div className="row__container">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-card__img" />
              <div className="skeleton-card__body">
                <div className="skeleton-card__line" />
                <div className="skeleton-card__line skeleton-card__line--short" />
              </div>
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <p className="row__empty">No content available</p>
      ) : (
        <div className="row__container" ref={containerRef}>
          {displayItems.map((item, i) => {
            const itemType = detectType(item)
            const isShow = itemType === 'TV Show' || itemType === 'Anime'
            const key = item.id ? `rated-${item.id}` : `rated-idx-${i}`

            if (isShow) {
              const displayName = item.imdbTitle || getCleanTitle(item)
              const sNum = item.seasonNum || 1
              const group = {
                displayName,
                representative: item,
                posts: [item],
                seasons: { [sNum]: [item] }
              }
              return <ShowCard key={key} group={group} onWatch={onWatch} />
            }
            return <ContentCard key={key} item={item} onWatch={onWatch} />
          })}
        </div>
      )}
    </section>
  )
}
