/**
 * Helper function to resolve asset paths from the site root, so they work
 * on any route (e.g. /reader, /about) with browser history routing.
 */
export const getAssetPath = (path: string): string => {
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
};
