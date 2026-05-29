'use client'

import { useState, useEffect, useCallback } from 'react'

export default function PlayerModal({ item, onClose }) {
  const [loading, setLoading] = useState(true)
  const [embedUrl, setEmbedUrl] = useState('')

  useEffect(() => {
    setLoading(true)
    const content = item?.content?.rendered || ''
    const match = content.match(/https?:\/\/[^"'\s]+(?:embed|e|watch|play)[^"'\s]*/i)
    setEmbedUrl(match ? match[0] : '')
    setLoading(false)
  }, [item])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'f' || e.key === 'F') {
      const iframe = document.querySelector('.player__iframe')
      if (iframe) iframe.requestFullscreen?.()
    }
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div className="player__backdrop" onClick={onClose}>
      <div className="player__container" onClick={e => e.stopPropagation()}>
        <button className="player__close" onClick={onClose}>&times;</button>
        {loading && <div className="player__loading" />}
        {embedUrl ? (
          <iframe
            className="player__iframe"
            src={embedUrl}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        ) : (
          !loading && <div className="player__error">No embed URL</div>
        )}
      </div>
    </div>
  )
}
