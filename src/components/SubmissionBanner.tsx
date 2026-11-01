import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { getAssetPath } from '../utils/pathUtils';
import { daysUntil, formatDeadline } from '../utils/deadline';
import type { OpenCall } from '../utils/submissionCall';
import { Ticker } from './Ticker';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Entrance, in step with the page header: the card rises in, then its contents
// follow one after another. After that the ticker strip keeps moving.
const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT, delay: 0.15, delayChildren: 0.3, staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Poster wipes in from the right, like a page being revealed
const wipe: Variants = {
  hidden: { clipPath: 'inset(0 0 0 100%)' },
  show: { clipPath: 'inset(0 0 0 0%)', transition: { duration: 0.8, ease: EASE_OUT } },
};

const nudge: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: {
    opacity: 1,
    x: 0,
    scale: [1, 1.08, 1],
    transition: {
      opacity: { duration: 0.3 },
      x: { duration: 0.3 },
      scale: { duration: 0.5, delay: 0.5, ease: 'easeInOut' },
    },
  },
};

// "Submissions open" call-out for the home page. Home loads the call together
// with the issues (see fetchOpenCall), so the banner is in place from the first
// frame and never pushes the page down after it has appeared.
export const SubmissionBanner = ({ call }: { call: OpenCall }) => {
  // The poster's space is reserved up front; it only wipes in once it has loaded
  const [posterLoaded, setPosterLoaded] = useState(false);

  const days = daysUntil(call.deadline);
  const daysLeft = days === 0 ? 'Last day!' : `${days} day${days === 1 ? '' : 's'} left`;
  const deadline = formatDeadline(call.deadline);
  const poster = call.posters?.[0];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div className="pb-12" variants={card} initial="hidden" animate="show">
        <Link
          to="/submission"
          className="group block overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-400"
        >
          <Ticker
            items={[
              'Submissions open',
              `${call.issue ?? call.title} — ${call.theme}`,
              ...(call.highlights ?? []),
              `Deadline ${deadline}`,
              daysLeft,
            ]}
          />

          {/* Editorial spread: the invitation on the left, the full poster on the right */}
          <div className="flex items-center">
            <div className="flex-1 min-w-0 p-5 sm:p-10">
              <motion.p
                variants={item}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400"
              >
                The Reuby · {call.issue ?? call.title}
              </motion.p>
              <motion.p
                variants={item}
                className="mt-2 font-serif text-[2rem] sm:text-6xl leading-none tracking-tight text-primary-700 dark:text-primary-300"
              >
                {call.theme}
              </motion.p>
              {call.prompt && (
                <motion.p
                  variants={item}
                  className="mt-3 sm:mt-4 max-w-md font-serif italic text-base sm:text-xl leading-snug text-slate-600 dark:text-slate-300"
                >
                  “{call.prompt}”
                </motion.p>
              )}
              <motion.div variants={item} className="mt-5 sm:mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                <motion.span
                  variants={nudge}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-primary-600 text-white text-sm sm:text-base font-semibold group-hover:bg-primary-700 transition-colors"
                >
                  Submit your work
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.span>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Deadline <span className="font-semibold text-slate-700 dark:text-slate-200">{deadline}</span>
                </span>
              </motion.div>
            </div>

            {poster && (
              <div className="flex-shrink-0 pr-5 sm:pr-10 py-5 sm:py-8">
                {/* A-series poster ratio (1 : 1.414) keeps the card from resizing when the image arrives.
                    Only transform/shadow are CSS-transitioned: clip-path is driven by the wipe. */}
                <motion.img
                  variants={wipe}
                  initial="hidden"
                  animate={posterLoaded ? 'show' : 'hidden'}
                  onLoad={() => setPosterLoaded(true)}
                  onError={() => setPosterLoaded(true)}
                  src={getAssetPath(poster.src)}
                  alt={poster.alt}
                  className="w-24 sm:w-44 aspect-[1/1.414] object-cover rounded-sm bg-slate-100 dark:bg-slate-700 shadow-xl ring-1 ring-slate-200 dark:ring-slate-600 group-hover:-translate-y-1 group-hover:shadow-2xl transition-[transform,box-shadow] duration-300"
                />
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    </div>
  );
};
