/**
 * Helper function to resolve asset paths correctly in both development and production
 * environments when deployed to GitHub Pages or other static hosts
 */
export const getAssetPath = (path: string): string => {
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `./${normalizedPath}`;
}; 