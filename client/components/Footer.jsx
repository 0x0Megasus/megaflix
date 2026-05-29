'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [showContact, setShowContact] = useState(false)

  return (
    <>
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__brand">MegaFlix</div>
          <div className="footer__links">
            <Link href="/dmca">DMCA</Link>
            <button onClick={() => setShowContact(true)}>Contact</button>
          </div>
          <p className="footer__disclaimer">
            MegaFlix does not host any files on its servers. All content is provided by third-party sources.
          </p>
          <p className="footer__copy">&copy; {new Date().getFullYear()} MegaFlix. All rights reserved.</p>
        </div>
      </footer>
      {showContact && (
        <div className="modal__backdrop" onClick={() => setShowContact(false)}>
          <div className="contact-panel" onClick={e => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setShowContact(false)}>&times;</button>
            <h2>Contact Us</h2>
            <p>Email: <a href="mailto:megaflix@proton.me">megaflix@proton.me</a></p>
            <p>For DMCA takedown requests, please see our <Link href="/dmca">DMCA page</Link>.</p>
          </div>
        </div>
      )}
    </>
  )
}
