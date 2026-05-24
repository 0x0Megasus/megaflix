import { useNavigate, useLocation } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { useScrollPosition } from '../hooks/useScrollPosition'

const NAVS = [
  { path: '/', label: 'Home', end: true },
  { path: '/movies', label: 'Movies', end: false },
  { path: '/tv', label: 'TV Shows', end: false },
  { path: '/anime', label: 'Anime', end: false },
]

export default function Navbar() {
  const scrolled = useScrollPosition(60)
  const navigate = useNavigate()
  const location = useLocation()

  const isSearch = location.pathname === '/search'

  const handleSearchOpen = () => {
    window.scrollTo(0, 0)
    navigate('/search')
  }

  return (
    <nav className={`navbar${scrolled ? ' navbar--solid' : ''}`}>
      <div className="navbar__left">
        <span className="navbar__brand" onClick={() => navigate('/')}>
          MEGAFLIX
        </span>
        <div className="navbar__links">
          {NAVS.map(({ path, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="navbar__right">
        {isSearch ? (
          <button className="navbar__search-close" onClick={() => navigate('/')}>
            ✕
          </button>
        ) : (
          <button className="navbar__search-btn" onClick={handleSearchOpen}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}
      </div>
    </nav>
  )
}
