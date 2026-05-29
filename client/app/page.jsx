'use client'

import { useState, useEffect } from 'react'
import HeroBanner from '@/components/HeroBanner'
import TopRatedRow from '@/components/TopRatedRow'
import { fetchContent, fetchBestContent } from '@/services/api'
import { getCategoryIds } from '@/services/utils'

export default function HomePage() {
  const [heroItem, setHeroItem] = useState(null)
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setHeroLoading(true)
      try {
        const [tvContent] = await Promise.all([fetchContent('tv', '', 1)])
        if (cancelled) return
        const hero = Array.isArray(tvContent)
          ? tvContent.find(i => !getCategoryIds(i).some(c => [5, 8].includes(c))) || tvContent[0]
          : null
        setHeroItem(hero)
      } catch {
        // empty state
      } finally {
        if (!cancelled) setHeroLoading(false)
      }
      fetchBestContent('movies', 10).catch(() => {})
      fetchBestContent('tv', 10).catch(() => {})
      fetchBestContent('anime', 10).catch(() => {})
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="home-page">
      <HeroBanner item={heroItem} loading={heroLoading} />
      <TopRatedRow type="movies" label="Top Rated Movies" />
      <TopRatedRow type="tv" label="Top Rated TV Shows" />
      <TopRatedRow type="anime" label="Top Rated Anime" />
    </main>
  )
}
