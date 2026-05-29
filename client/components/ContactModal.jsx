'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'

export default function ContactModal({ onClose }) {
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
    <div className="episode-modal">
      <div className="episode-modal__backdrop" onClick={onClose} />
      <div className="episode-modal__panel contact-panel">
        <div className="episode-modal__header">
          <h2 className="episode-modal__title">Contact Us</h2>
          <button className="episode-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="contact-panel__body">
          <p className="contact-panel__text">
            Have a question, suggestion, or need to report an issue? We&rsquo;d love to hear from you.
          </p>
          <div className="contact-panel__item">
            <span className="contact-panel__label">Email</span>
            <a href="mailto:itsmegasus@gmail.com" className="contact-panel__value">itsmegasus@gmail.com</a>
          </div>
          <div className="contact-panel__item">
            <span className="contact-panel__label">DMCA</span>
            <span className="contact-panel__value">For takedown requests, please visit our <Link href="/dmca">DMCA page</Link>.</span>
          </div>
          <p className="contact-panel__footnote">
            We aim to respond to all inquiries within 48 hours.
          </p>
        </div>
      </div>
    </div>
  )
}
