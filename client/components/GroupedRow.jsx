'use client'

import { useRef, useCallback, useMemo } from 'react'
import { useContent } from '@/hooks/useContent'
import { groupByShow, pickBiggestSeason, hasFullSeason, scoreGroup, matchTitle } from '@/services/utils'
import ShowCard from './ShowCard'
import LoadingSkeleton from './LoadingSkeleton'

export default function GroupedRow({ title, filter, page = 1, searchTerm = '', categories = '', externalItems, limit, grid }) {
  const { items: fetchedItems, loading: fetchLoading } = useContent(filter, searchTerm, page, categories)
  const containerRef = useRef(null)
  const loading = !externalItems && fetchLoading

  const groups = useMemo(() => {
    let source = externalItems || fetchedItems
    if (!source.length) return []
    if (externalItems && searchTerm) {
      source = source.filter(item => matchTitle(item, searchTerm))
    }
    const grouped = groupByShow(source)
    grouped.sort((a, b) => scoreGroup(b) - scoreGroup(a))
    let result = grouped.map(g => ({ ...g, ...pickBiggestSeason(g) }))

    if ((filter === 'tv' || filter === 'anime') && result.length > 0) {
      result = result.filter(g => hasFullSeason(g))
    }

    if (limit) result = result.slice(0, limit)
    return result
  }, [fetchedItems, externalItems, searchTerm, limit, filter])

  const scroll = useCallback((dir) => {
    if (!containerRef.current) return
    const amount = containerRef.current.clientWidth * 0.75
    containerRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }, [])

  const showArrows = !grid && groups.length > 4

  if (!loading && groups.length === 0) return null

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

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className={grid ? 'row__grid' : 'row__container'} ref={grid ? null : containerRef}>
          {groups.map((group, i) => (
            <ShowCard
              key={group.displayName + i}
              group={group}
            />
          ))}
        </div>
      )}
    </section>
  )
}
