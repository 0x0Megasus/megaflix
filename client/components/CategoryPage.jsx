'use client'

import { useState, useEffect } from 'react'
import { fetchContent, fetchBestContent } from '@/services/api'
import { groupByShow, pickBiggestSeason, getCategoryIds, detectType } from '@/services/utils'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function CategoryPage({ filter, label }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [content] = await Promise.all([fetchContent(filter)])
        if (!cancelled) setItems(Array.isArray(content) ? content : [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [filter])

  if (loading) return <LoadingSkeleton title={label} count={6} />

  return (
    <main className="category-page">
      <h1>{label}</h1>
      <div className="content-grid">
        {items.map(item => (
          <div key={item.id} className="card">{item.title?.rendered || 'Untitled'}</div>
        ))}
      </div>
    </main>
  )
}
