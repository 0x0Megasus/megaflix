const SITE_NAME = 'MegaFlix'
const DEFAULT_DESC = 'Watch free movies, TV shows, and anime online in HD streaming at MegaFlix. Enjoy the latest action, crime, and drama series without registration. Your destination for top-rated entertainment available 24/7.'
const DEFAULT_IMAGE = 'https://www.megaflix.cc/og-image.jpg'
const URL = 'https://www.megaflix.cc'

export default function SEO({ title, description, path = '', image }) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - Stream Movies, TV Shows & Anime Free Online`
  const desc = description || DEFAULT_DESC
  const ogImage = image || DEFAULT_IMAGE
  const canonical = path ? `${URL}${path.startsWith('/') ? path : '/' + path}` : URL

  return null
}
