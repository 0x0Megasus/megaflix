'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollPosition } from '@/hooks/useScrollPosition'

export default function Navbar() {
  const scrolled = useScrollPosition(50)
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className={`navbar${scrolled ? ' navbar--solid' : ''}`}>
      <div className="navbar__container">
        <Link href="/" className="navbar__brand">MegaFlix</Link>
        <div className="navbar__links">
          <Link href="/" className={`navbar__link${pathname === '/' ? ' active' : ''}`}>Home</Link>
          <Link href="/movies" className={`navbar__link${pathname === '/movies' ? ' active' : ''}`}>Movies</Link>
          <Link href="/tv" className={`navbar__link${pathname === '/tv' ? ' active' : ''}`}>TV Shows</Link>
          <Link href="/anime" className={`navbar__link${pathname === '/anime' ? ' active' : ''}`}>Anime</Link>
        </div>
        <button className="navbar__search-btn" onClick={() => router.push('/search')}>
          Search
        </button>
      </div>
    </nav>
  )
}
