import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContactModal from './ContactModal'

export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">MEGAFLIX</div>
        <div className="footer__actions">
          <Link to="/dmca" className="footer__action">DMCA</Link>
          <button className="footer__action" onClick={() => setContactOpen(true)}>Contact Us</button>
        </div>
        <p className="footer__notice">
          This site does not store any files on our server, we only linked to the media which is hosted on 3rd party services.
        </p>
        <div className="footer__social">
          <span>&copy; {new Date().getFullYear()} MegaFlix. All rights reserved.</span>
        </div>
      </div>
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </footer>
  )
}
