import { getAssetPath } from './pathUtils';
import { isDeadlineOpen } from './deadline';

// The current call for submissions, as stored in /data/submission/guidelines.json
export type OpenCall = {
  title: string;
  theme: string;
  issue?: string;
  prompt?: string;
  highlights?: string[];
  deadline: string;
  posters?: { src: string; alt: string }[];
  /** One line from the poster explaining the theme. */
  definition?: string;
  /**
   * Pieces cut from the poster for the home page hero: the theme's lettering,
   * a figure that sits in the bottom-right corner, a CSS background sampled
   * from the poster, and colours from the lettering (first to last) that the
   * days left run through. Without it the hero shows the whole poster.
   */
  hero?: { title: string; figure?: string; background: string; palette?: string[] };
};

// The current call if submissions are still open, otherwise null. Never throws:
// the banner is optional, so a failed fetch just means no banner.
export const fetchOpenCall = async (): Promise<OpenCall | null> => {
  try {
    const response = await fetch(getAssetPath(`/data/submission/guidelines.json?t=${new Date().getTime()}`));
    if (!response.ok) return null;
    const current = (await response.json())?.current;
    return current?.deadline && isDeadlineOpen(current.deadline) ? current : null;
  } catch {
    return null;
  }
};
