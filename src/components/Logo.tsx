import { getAssetPath } from '../utils/pathUtils';

// The wordmark on a transparent ground: ink on paper in light mode, paper on
// ink in dark mode. The ruby facet of the gem keeps its colour in both.
export const Logo = ({ className = '' }: { className?: string }) => (
  <>
    <img
      src={getAssetPath('/images/reuby_logo_ink.png')}
      alt="Reuby Logo"
      className={`${className} dark:hidden`}
    />
    <img
      src={getAssetPath('/images/reuby_logo_paper.png')}
      alt="Reuby Logo"
      className={`${className} hidden dark:block`}
    />
  </>
);
