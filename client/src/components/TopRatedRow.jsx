import { useState, useEffect, useRef, useCallback } from 'react'

import { fetchBestContent, fetchContent } from '../services/api'
import { getCleanTitle, detectType } from '../services/utils'
import ContentCard from './ContentCard'
import ShowCard from './ShowCard'
import LoadingSkeleton from './LoadingSkeleton'

export default function TopRatedRow({ title, type, filter, onWatch, items: externalItems, limit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    if (externalItems) return
    let cancelled = false
    setLoading(true)

    async function loadTopRated() {
      const isShowType = (type || filter) === 'tv' || (type || filter) === 'anime'

      try {
        // HYPER-PARALLEL: Start both fetches simultaneously
        const [bestData, fallbackData] = await Promise.all([
          fetchBestContent(type || filter, limit, !isShowType).catch(() => []),
          filter ? fetchContent(filter, '', 1).catch(() => []) : Promise.resolve([])
        ]);

        let combined = [...(Array.isArray(bestData) ? bestData : [])];
        
        // Fill up to limit with fallback if needed
        if (combined.length < (limit || 10) && Array.isArray(fallbackData)) {
          const seenIds = new Set(combined.map(i => i.id));
          const fill = fallbackData.filter(i => !seenIds.has(i.id));
          combined = [...combined, ...fill];
        }

        if (!cancelled) {
          let finalData = combined.slice(0, limit || 10)
          
          // STRICT TYPE GUARD: Filter out items that don't match the row's intended category
          if (filter === 'anime') {
            finalData = finalData.filter(item => {
              const t = detectType(item)
              return t === 'Anime' || t === 'Anime Movie'
            })
          } else if (filter === 'tv') {
            finalData = finalData.filter(item => detectType(item) === 'TV Show')
          } else if (filter === 'movies') {
            finalData = finalData.filter(item => detectType(item) === 'Movie')
          }

          setItems(finalData)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setItems([])
          setLoading(false)
        }
      }
    }

    loadTopRated()
    return () => { cancelled = true }
  }, [type, filter, externalItems, limit])

  const displayItems = limit ? (externalItems || items).slice(0, limit) : (externalItems || items)
  const displayLoading = loading && !externalItems
  const isShowType = (type || filter) === 'tv' || (type || filter) === 'anime'

  const [canScroll, setCanScroll] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) { setCanScroll(false); return }
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [displayItems])

  const scroll = useCallback((dir) => {
    if (!containerRef.current) return
    const amount = containerRef.current.clientWidth * 0.75
    containerRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }, [])

  const showArrows = canScroll

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        {showArrows && (
          <div className="row__arrows">
            <button className="row__arrow" onClick={() => scroll('left')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <button className="row__arrow" onClick={() => scroll('right')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {displayLoading ? (
        <LoadingSkeleton />
      ) : displayItems.length === 0 ? (
        <p className="row__empty">No content available</p>
      ) : (
        <div className="row__container" ref={containerRef}>
          {displayItems.map((item, i) => {
            const itemType = detectType(item)
            const isShow = itemType === 'TV Show' || itemType === 'Anime'
            const isMovie = itemType === 'Movie' || itemType === 'Anime Movie'
            const key = item.id ? `rated-${item.id}` : `rated-idx-${i}`

            if (isShow) {
              const displayName = item.imdbTitle || getCleanTitle(item)
              // Create a robust group for ShowCard with a guaranteed Season 1 fallback
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
