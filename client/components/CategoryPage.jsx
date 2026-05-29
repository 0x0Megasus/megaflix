'use client'

import { useState, useEffect } from 'react'
import HeroBanner from '@/components/HeroBanner'
import ContentCard from '@/components/ContentCard'
import ShowCard from '@/components/ShowCard'
import TopRatedRow from '@/components/TopRatedRow'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { fetchContent } from '@/services/api'
import { groupByShow, pickBiggestSeason, detectType } from '@/services/utils'

export default function CategoryPage({ filter, label }) {
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

  const isShowType = filter === 'tv' || filter === 'anime'

  if (loading) {
    return (
      <main className="category-page">
        <HeroBanner loading={true} />
        <LoadingSkeleton title={`Top ${label}`} count={10} />
        <LoadingSkeleton title={`More ${label}`} count={10} />
      </main>
    )
  }

  const catHero = items?.[0] || null

  const displayItems = isShowType
    ? groupByShow(items).map(g => {
        const season = pickBiggestSeason(g)
        const sNum = season.seasonNum || 1
        if (Object.keys(g.seasons).length === 0) {
          g.seasons[sNum] = g.posts
        }
        return { ...g, ...season }
      })
    : items || []

  const moreItems = displayItems.slice(0, 10)

  return (
    <main className="category-page">
      {catHero && <HeroBanner item={catHero} />}

      <section className="category-page__content">
        <TopRatedRow
          title={`Top ${label}`}
          filter={filter}
          limit={10}
        />

        <div className="row">
          <div className="row__header">
            <h2 className="row__title">More {label}</h2>
          </div>
          <div className="row__grid">
            {moreItems.length === 0 ? (
              <p className="row__empty">No {label.toLowerCase()} available</p>
            ) : (
              moreItems.map((g, i) => {
                const item = g.representative || g
                const type = detectType(item)
                const key = item.id ? `item-${item.id}` : `group-${g.displayName || i}`

                if (type === 'TV Show' || type === 'Anime') {
                  return <ShowCard key={key} group={g} />
                }
                return <ContentCard key={key} item={item} />
              })
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
