import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Issue } from '../types';
import { getCoverPath, getReaderPath } from '../utils/pathUtils';

// Scroll that works through the pile (as a share of the section), and how much
// of each issue's turn rests on it before the next is picked up
const TURN_START = 0.04;
const TURN_END = 0.94;
const REST = 0.45;

// Issues still on the pile lie a little askew, each a touch down and to the
// right of the one above, so their edges show
const PILE_TILT = [-2.5, 2, -1.5, 3];
const PILE_SHIFT = { x: 2.2, y: 1.6 }; // % of a cover, per issue beneath

// Issues already picked up are laid in an overlapping row to the left of the
// pile, a little smaller: the most recent nearest the pile
const LAID_FIRST = -86; // % of a cover's width
const LAID_STEP = 30;
const LAID_SCALE = 0.8;

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The issues, newest first (as in issues.json), stacked together with the
// latest on top. Scrolling picks them up one by one: each lifts off the pile
// and is laid down beside it, so the next is on top, and none leaves the
// desk. The theme of the issue on top is set beneath, and the latest keeps
// its tag wherever it lies. Anyone who prefers reduced motion gets them as a
// plain list.
export const IssueStack = ({ issues }: { issues: Issue[] }) => {
  const reduceMotion = useReducedMotion();
  if (issues.length === 0) return null;
  return reduceMotion ? <IssueList issues={issues} /> : <PinnedPile issues={issues} />;
};

const PinnedPile = ({ issues }: { issues: Issue[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const n = issues.length;
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // How many issues have been picked up, as a continuous value: it rests on
  // each whole number for a while, then moves on to the next
  const position = useTransform(p, (v) => {
    const x = Math.min(Math.max((v - TURN_START) / (TURN_END - TURN_START), 0), 1) * (n - 1);
    const k = Math.min(Math.floor(x), n - 2);
    const f = x - k;
    return n < 2 ? 0 : k + (f < REST ? 0 : smooth((f - REST) / (1 - REST)));
  });
  // A little give, so each issue settles rather than stops
  const turn = useSpring(position, { stiffness: 220, damping: 30, mass: 0.5 });

  const [top, setTop] = useState(0);
  useMotionValueEvent(turn, 'change', (v) => setTop(Math.min(n - 1, Math.max(0, Math.round(v)))));

  // Scroll the page to where issue i is on top of the pile
  const turnTo = (i: number) => {
    const section = ref.current;
    if (!section) return;
    const range = section.offsetHeight - window.innerHeight;
    const v = TURN_START + (TURN_END - TURN_START) * (n < 2 ? 0 : (i + REST / 2) / (n - 1));
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: sectionTop + Math.min(v, TURN_END) * range, behavior: 'smooth' });
  };

  const issue = issues[top];

  return (
    <section ref={ref} className="relative" style={{ height: `${100 + n * 70}vh` }}>
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden flex flex-col items-center justify-center px-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">All Issues</p>

        <div className="relative mt-10 h-[min(42svh,520px)] sm:h-[min(48svh,520px)] aspect-[1/1.414]">
          {issues.map((item, i) => (
            <PileCover
              key={item.slug}
              issue={item}
              index={i}
              turn={turn}
              isTop={i === top}
              isLatest={i === 0}
              onTurnTo={() => turnTo(i)}
            />
          ))}
        </div>

        <div className="relative mt-10 h-32 w-full max-w-xl text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={issue.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-none text-ink">
                {issue.theme ?? issue.name}
              </h3>
              <p className="mt-3 text-sm text-muted">
                {issue.name} · {issue.oxfordTerm}
              </p>
              <Link
                to={getReaderPath(issue.slug)}
                className="group mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-accent"
              >
                Read Issue
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Where you are in the pile; each dot brings that issue to the top */}
        <div className="absolute bottom-5 flex gap-1">
          {issues.map((item, i) => (
            <button
              key={item.slug}
              onClick={() => turnTo(i)}
              aria-label={item.theme ?? item.name}
              aria-current={i === top ? 'true' : undefined}
              className="p-1.5"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${i === top ? 'w-6 bg-ink/70' : 'w-1.5 bg-ink/20 hover:bg-ink/40'}`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// Where an issue lies, given how far it is from the top of the pile (`d`, in
// issues): beneath (d > 0), on top (0), being picked up and laid down
// (between -1 and 0), or laid beside the pile (-1 and below)
const placeOf = (d: number, index: number) => {
  if (d >= 0) {
    const depth = Math.min(d, 3);
    return {
      x: depth * PILE_SHIFT.x,
      y: depth * PILE_SHIFT.y,
      rotate: PILE_TILT[index % PILE_TILT.length] * Math.min(d, 1),
      scale: 1,
      zIndex: 100 - Math.round(d * 10),
      opacity: d > 3.5 ? 0 : 1,
    };
  }
  if (d > -1) {
    // Lifted towards you in an arc, then set down beside the pile
    const u = -d;
    const arc = Math.sin(Math.PI * u);
    return {
      x: lerp(0, LAID_FIRST, smooth(u)),
      y: -arc * 10,
      rotate: -arc * 5,
      scale: lerp(1, LAID_SCALE, smooth(u)) + arc * 0.05,
      zIndex: 110,
      opacity: 1,
    };
  }
  const k = -d - 1;
  return { x: LAID_FIRST - k * LAID_STEP, y: 0, rotate: 0, scale: LAID_SCALE, zIndex: 50 - Math.round(k), opacity: 1 };
};

const PileCover = ({
  issue,
  index,
  turn,
  isTop,
  isLatest,
  onTurnTo,
}: {
  issue: Issue;
  index: number;
  turn: MotionValue<number>;
  isTop: boolean;
  isLatest: boolean;
  onTurnTo: () => void;
}) => {
  const place = useTransform(turn, (v) => placeOf(index - v, index));
  const x = useTransform(place, (s) => `${s.x}%`);
  const y = useTransform(place, (s) => `${s.y}%`);
  const rotate = useTransform(place, (s) => s.rotate);
  const scale = useTransform(place, (s) => s.scale);
  const zIndex = useTransform(place, (s) => s.zIndex);
  const opacity = useTransform(place, (s) => s.opacity);

  const cover = (
    <img
      src={getCoverPath(issue)}
      alt={`${issue.name} cover`}
      className="h-full w-full object-cover rounded-sm bg-paper shadow-page"
    />
  );

  return (
    <motion.div style={{ x, y, rotate, scale, zIndex, opacity, transformOrigin: '50% 100%' }} className="absolute inset-0">
      {isTop ? (
        <Link to={getReaderPath(issue.slug)} className="block h-full w-full">
          {cover}
        </Link>
      ) : (
        // Any other issue, on the pile or beside it, brings itself to the top
        <button onClick={onTurnTo} tabIndex={-1} aria-hidden="true" className="block h-full w-full cursor-pointer">
          {cover}
        </button>
      )}
      {isLatest && (
        <span className="pointer-events-none absolute -top-3 left-4 bg-accent px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper shadow-sm">
          Latest Issue
        </span>
      )}
    </motion.div>
  );
};

// Reduced motion: the same issues, newest first, as a quiet list
const IssueList = ({ issues }: { issues: Issue[] }) => (
  <section className="container max-w-3xl mx-auto px-4 sm:px-6 py-20">
    <p className="text-[11px] uppercase tracking-[0.25em] text-muted">All Issues</p>
    <ul className="mt-8 divide-y divide-ink/10">
      {issues.map((issue, i) => (
        <li key={issue.slug}>
          <Link to={getReaderPath(issue.slug)} className="group flex items-center gap-6 py-6">
            <img
              src={getCoverPath(issue)}
              alt={`${issue.name} cover`}
              loading="lazy"
              className="w-20 sm:w-24 aspect-[1/1.414] object-cover rounded-sm bg-paper shadow-page"
            />
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
                {issue.theme ?? issue.name}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {issue.name} · {issue.oxfordTerm}
                {i === 0 && <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-accent">Latest Issue</span>}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  </section>
);
