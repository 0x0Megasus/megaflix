import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'MegaFlix'
const DEFAULT_DESC = 'Watch free movies, TV shows, and anime online in HD streaming at MegaFlix. Enjoy the latest action, crime, and drama series without registration. Your destination for top-rated entertainment available 24/7.'
const DEFAULT_IMAGE = 'https://www.megaflix.cc/og-image.jpg'
const URL = 'https://www.megaflix.cc'

export default function SEO({ title, description, path = '', image }) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - Stream Movies, TV Shows & Anime Free Online`
  const desc = description || DEFAULT_DESC
  const ogImage = image || DEFAULT_IMAGE
  const canonical = path ? `${URL}${path.startsWith('/') ? path : '/' + path}` : URL

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: URL,
    description: DEFAULT_DESC,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />

      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}
