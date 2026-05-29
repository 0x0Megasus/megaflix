'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [input, setInput] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input) {
        router.push(`/search?q=${encodeURIComponent(input)}`)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [input, router])

  return (
    <main className="search-page">
      <div className="search__header">
        <input
          className="search__input"
          type="text"
          placeholder="Search movies, TV shows, anime..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </div>
      {query && <p className="search__results-info">Results for: {query}</p>}
    </main>
  )
}
