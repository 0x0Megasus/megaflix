import { useState, useEffect } from 'react'
import { fetchContent } from '../services/api'

export function useContent(filter, search = '', page = 1, categories = '') {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchContent(filter, search, page, categories)
      .then(data => {
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [filter, search, page, categories])

  return { items, loading }
}
