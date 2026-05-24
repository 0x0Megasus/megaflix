import { useEffect, useCallback } from 'react'

export default function PlayerModal({ item, onClose }) {
  const title = item.title?.rendered || 'Untitled'

  const playerUrl = (() => {
    // 1. Try to find iframe in content
    const content = item.content?.rendered || ''
    const iframeMatch = content.match(/<iframe.*?src=["'](.*?)["']/i)
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1]
    }

    // 2. Fallback to permalink logic
    try {
      const u = new URL(item.link)
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
          <iframe
            src={playerUrl}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
