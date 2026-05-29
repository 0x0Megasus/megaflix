'use client'

import { useState } from 'react'
import Link from 'next/link'
import ContactModal from './ContactModal'

export default function Footer() {
  const [showContact, setShowContact] = useState(false)

  return (
    <>
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__brand">MegaFlix</div>
          <div className="footer__links">
            <Link href="/dmca">DMCA</Link>
            <button onClick={() => setShowContact(true)}>Contact Us</button>
          </div>
          <p className="footer__disclaimer">
            MegaFlix does not host any files on its servers. All content is provided by third-party sources.
          </p>
          <p className="footer__copy" suppressHydrationWarning>&copy; {new Date().getFullYear()} MegaFlix. All rights reserved.</p>
        </div>
      </footer>
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  )
}
