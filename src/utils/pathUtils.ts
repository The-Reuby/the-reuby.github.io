/**
 * Helper function to resolve asset paths from the site root, so they work
 * on any route (e.g. /reader, /about) with browser history routing.
 */
export const getAssetPath = (path: string): string => {
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
};

/** Cover thumbnail: explicit `cover` override, else convention covers/<slug>.png. */
export const getCoverPath = (issue: { slug: string; cover?: string }): string =>
  getAssetPath(issue.cover ?? `/magazines/covers/${issue.slug}.png`);

/** Reader link for an issue, optionally opened at a page (app page, cover = 0). */
export const getReaderPath = (slug: string, page?: number): string =>
  `/reader?issue=${slug}${page ? `&page=${page}` : ''}`;
