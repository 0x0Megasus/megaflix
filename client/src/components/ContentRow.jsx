import { useRef, useCallback, useState, useEffect } from 'react'
import { useContent } from '../hooks/useContent'
import ContentCard from './ContentCard'
import LoadingSkeleton from './LoadingSkeleton'

export default function ContentRow({ title, filter, onWatch, searchTerm = '', categories = '', limit }) {
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const { items, loading } = useContent(filter, searchTerm, page, categories)
  const containerRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    setPage(1)
    setAllItems([])
    setHasMore(true)
  }, [filter, searchTerm, categories])

  useEffect(() => {
    if (!items) return
    setAllItems(prev => {
      const next = items.filter(item => !prev.some(p => p.id === item.id))
      return [...prev, ...next]
    })
    setHasMore(items.length === 50)
  }, [items])

  const displayed = limit ? allItems.slice(0, limit) : allItems

  const [canScroll, setCanScroll] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) { setCanScroll(false); return }
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [allItems])

  const showArrows = canScroll

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(p => p + 1)
    }
  }, [loading, hasMore])

  useEffect(() => {
    if (!observerRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          handleLoadMore()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [handleLoadMore, loading, hasMore])

  const scroll = useCallback((dir) => {
    if (!containerRef.current) return
    const amount = containerRef.current.clientWidth * 0.75
    containerRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }, [])

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        {showArrows && (
          <div className="row__arrows">
            <button className="row__arrow" onClick={() => scroll('left')} aria-label="Scroll left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <button className="row__arrow" onClick={() => scroll('right')} aria-label="Scroll right">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {loading && allItems.length === 0 ? (
        <LoadingSkeleton />
      ) : displayed.length === 0 ? (
        <p className="row__empty">No content available</p>
      ) : (
        <>
          <div className="row__container" ref={containerRef}>
            {displayed.map((item, i) => (
              <ContentCard key={item.id || i} item={item} onWatch={onWatch} />
            ))}
          </div>
          <div ref={observerRef} className="row__sentinel" />
          {loading && <p className="row__loading">Loading more...</p>}
        </>
      )}
    </section>
  )
}
