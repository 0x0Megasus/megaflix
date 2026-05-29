'use client'

import { useState, useEffect } from 'react'
import { fetchBestContent } from '@/services/api'

export default function TopRatedRow({ type, label }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchBestContent(type, 10).then(data => {
      if (!cancelled) setItems(Array.isArray(data) ? data : [])
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [type])

  if (loading || items.length === 0) return null

  return (
    <section className="row">
      <h2 className="row__title">{label}</h2>
      <div className="row__container">
        <div className="row__cards">
          {items.map(item => (
            <div key={item.id} className="card">
              <div className="card__img-wrap">
                <img
                  className="card__img"
                  src={item._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''}
                  alt={item.title?.rendered || ''}
                  loading="lazy"
                />
              </div>
              <div className="card__body">
                <h3 className="card__title">{item.title?.rendered || ''}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
