import { useState, useEffect, useCallback } from 'react'
import { stripArabic } from '../services/utils'

export default function PlayerModal({ item, onClose }) {
  const [loaded, setLoaded] = useState(false)
  const title = stripArabic(item.title?.rendered || 'Untitled')

  const playerUrl = (() => {
    const content = item.content?.rendered || ''
    const iframeMatch = content.match(/<iframe.*?src=["'](.*?)["']/i)
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1].replace(/^http:\/\//i, 'https://')
    }

    try {
      const u = new URL(item.link)
      u.protocol = 'https:'
      u.searchParams.set('embedScreen', 'true')
      return u.toString()
    } catch {
      return ''
    }
  })()

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__wrapper">
          {!loaded && (
            <div className="modal__loader">
              <div className="modal__spinner" />
              <span>Loading player...</span>
            </div>
          )}
          <iframe
            src={playerUrl}
            title={title}
            onLoad={() => setLoaded(true)}
            allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *"
            allowFullScreen
            playsinline
            webkitallowfullscreen
            mozallowfullscreen
          />
        </div>
      </div>
    </div>
  )
}
