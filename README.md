# MegaFlix

Watch movies, TV shows, and anime — free. Built with React 18 + Vite.

## What It Does

- Browse movies, TV, and anime
- Top-rated content from IMDb lists
- Search with type filters (All / Movies / TV / Anime)
- TV shows and anime grouped by series with episode picker
- Full-screen video player

## How It's Organized

```
src/
├── services/
│   ├── api.js       # Fetch + cache
│   └── utils.js     # Parse content
├── hooks/
│   ├── useContent.js
│   ├── useDebounce.js
│   ├── useHorizontalScroll.js
│   └── useScrollPosition.js
├── pages/
│   ├── HomePage.jsx
│   ├── CategoryPage.jsx
│   ├── DMCA.jsx
│   └── NotFoundPage.jsx
├── components/
│   ├── Navbar.jsx
│   ├── HeroBanner.jsx
│   ├── ContentRow.jsx
│   ├── ContentCard.jsx
│   ├── ShowCard.jsx
│   ├── GroupedRow.jsx
│   ├── TopRatedRow.jsx
│   ├── SearchResults.jsx
│   ├── PlayerModal.jsx
│   ├── EpisodeModal.jsx
│   ├── ContactModal.jsx
│   ├── Footer.jsx
│   ├── LoadingSkeleton.jsx
│   ├── ErrorBoundary.jsx
│   └── SEO.jsx
├── main.jsx       # Entry point
├── App.jsx        # Routes + state
├── base.css
├── nav.css
├── hero.css
├── rows.css
├── modals.css
├── pages.css
├── responsive.css
└── components.css
```

## Pages

| Route | What you see |
|---|---|
| `/` | Hero banner + top-rated rows |
| `/movies` | All movies |
| `/tv` | TV shows grouped by series |
| `/anime` | Anime grouped by series |
| `/search` | Search with filters |
| `/dmca` | Legal info |

## How It Works

You open the page → the app fetches movies/TV/anime from the server. Both sides keep a copy in memory so repeat visits are faster (client caches 30 min, server caches up to 1h).

Once loaded, you scroll through rows of cards. Click one → if it's a movie, the video player opens immediately. If it's a show or anime, you pick a season and episode first, then it plays.

Search works the same way — type something, wait a bit, results show up grouped by type.
