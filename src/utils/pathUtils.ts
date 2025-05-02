/**
 * Helper function to resolve asset paths correctly in both development and production
 * environments when using HashRouter
 */
export const getAssetPath = (path: string): string => {
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return normalizedPath;
}; 