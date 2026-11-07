import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import { getAssetPath } from '../utils/pathUtils';
import { daysUntil, formatDeadline } from '../utils/deadline';
import type { OpenCall } from '../utils/submissionCall';
import { revealGroup, revealItem } from '../utils/motion';
import { Ticker } from './Ticker';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const smooth = (t: number) => t * t * (3 - 2 * t);

// Poster wipes in from the right once loaded, like a page being revealed
const wipe: Variants = {
  hidden: { clipPath: 'inset(0 0 0 100%)' },
  show: { clipPath: 'inset(0 0 0 0%)', transition: { duration: 0.9, ease: EASE_OUT } },
};

const callDetails = (call: OpenCall) => {
  const days = daysUntil(call.deadline);
  return {
    days,
    daysLeft: days === 0 ? 'Last day!' : `${days} day${days === 1 ? '' : 's'} left`,
    deadline: formatDeadline(call.deadline),
  };
};

// The call's strapline, run across the top of the home page like the line
// across a magazine cover.
export const SubmissionTicker = ({ call }: { call: OpenCall }) => {
  const { daysLeft, deadline } = callDetails(call);
  return (
    <Link to="/submission" className="group block" aria-label="Submissions open">
      <Ticker
        items={[
          'Submissions open',
          `${call.issue ?? call.title} — ${call.theme}`,
          ...(call.highlights ?? []),
          `Deadline ${deadline}`,
          daysLeft,
        ]}
      />
    </Link>
  );
};

// The open call, as the first thing on the home page, set like a cover: the
// magazine's masthead at the top, the theme's lettering cut from the poster in
// the middle with its definition and the prompt beneath, and at the foot the
// deadline and the invitation, on a sheet coloured like the poster's sky. On
// every screen the sheet holds still while you scroll and the pieces arrive in
// turn; anyone who prefers reduced motion gets them all at once. Without cut
// pieces, the whole poster stands in for them.
export const SubmissionHero = ({ call }: { call: OpenCall }) => {
  const reduceMotion = useReducedMotion();
  if (!call.hero) return <PosterHero call={call} />;
  return reduceMotion ? <StackedSheet call={call} hero={call.hero} /> : <PinnedSheet call={call} hero={call.hero} />;
};

type Hero = NonNullable<OpenCall['hero']>;

const PinnedSheet = ({ call, hero }: { call: OpenCall; hero: Hero }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // From the first frame: the masthead, and the lettering in the very middle
  // of the sheet · 0.04–0.26 the lettering rises to its place as 0.14 the
  // definition and 0.2 the prompt arrive beneath it, the prompt read word by
  // word to 0.5 · 0.56 the deadline, its day ringed by 0.76 · 0.8 the invitation
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLImageElement>(null);
  // How far the lettering's resting place is above the middle of the sheet
  const lift = useMotionValue(0);
  const titleY = useTransform([p, lift], ([v, l]: number[]) => l * (1 - smooth(Math.min(Math.max((v - 0.04) / 0.22, 0), 1))));
  // Measured after titleY is set up, so its listener (a layout effect too)
  // is already in place to hear the first measurement
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const title = titleRef.current;
    if (!sheet || !title) return;
    const measure = () => {
      // offsetTop ignores transforms, so this is where the lettering rests
      let top = 0;
      for (let el: HTMLElement | null = title; el && el !== sheet; el = el.offsetParent as HTMLElement | null) {
        top += el.offsetTop;
      }
      lift.set(sheet.clientHeight / 2 - (top + title.offsetHeight / 2));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(title);
    return () => observer.disconnect();
  }, [lift]);
  const figureY = useTransform(p, [0.05, 0.4], ['70%', '0%']);
  const hint = useTransform(p, [0, 0.04], [1, 0]);
  const words = call.prompt?.split(' ') ?? [];
  const step = 0.28 / Math.max(words.length, 1);
  const draw = useTransform(p, [0.58, 0.76], [0, 1]);

  // Keep the button out of the tab order until it has arrived
  const [actionsShown, setActionsShown] = useState(false);
  useMotionValueEvent(p, 'change', (v) => setActionsShown(v > 0.82));

  return (
    // A shorter run on phones, where every screen of scrolling is a thumb swipe
    <div ref={ref} className="relative h-[270vh] sm:h-[320vh]">
      <div className="sticky top-16 h-[calc(100svh-4rem)] p-2 sm:p-4">
        <div
          ref={sheetRef}
          className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-sm shadow-page px-5 pt-[5svh] pb-[4svh] text-center text-white sm:px-8 sm:pt-[6svh] sm:pb-[5svh]"
          style={{ background: hero.background }}
        >
          <div aria-hidden="true" className="sky-drift"><span /></div>
          {hero.figure && (
            <motion.img
              style={{ y: figureY }}
              src={getAssetPath(hero.figure)}
              alt=""
              className="absolute right-0 bottom-0 h-[40%] sm:h-[52%] xl:h-[62%] w-auto pointer-events-none select-none"
            />
          )}

          <Masthead call={call} onSky className="relative" />

          {/* The lettering, its definition and the prompt, centred between
              masthead and foot */}
          <div className="relative flex w-full min-h-0 flex-1 flex-col items-center justify-center py-[2svh]">
            <motion.img
              ref={titleRef}
              style={{ y: titleY }}
              src={getAssetPath(hero.title)}
              alt={call.theme}
              className="w-full sm:w-[68%] max-w-5xl"
            />
            <div className="flex flex-col items-center">
              {call.definition && (
                <ScrollReveal progress={p} at={0.14}>
                  <p className="mt-3 sm:mt-5 max-w-[19rem] sm:max-w-none text-balance italic text-[15px] leading-snug sm:font-light sm:text-[clamp(1rem,1.4vw,1.4rem)] text-white/85">
                    {call.definition}
                  </p>
                </ScrollReveal>
              )}
              {words.length > 0 && (
                <ScrollReveal progress={p} at={0.2}>
                  <p className="mt-[4svh] sm:mt-[5svh] max-w-[20rem] sm:max-w-[40rem] text-balance text-[clamp(1.4rem,3.9svh,1.9rem)] leading-[1.18] sm:text-[clamp(1.6rem,2.4vw,2.6rem)] sm:leading-tight font-semibold tracking-tight">
                    {words.map((word, i) => (
                      <Fragment key={i}>
                        <ReadWord progress={p} at={0.22 + i * step}>
                          {i === 0 ? '“' : ''}{word}{i === words.length - 1 ? '”' : ''}
                        </ReadWord>{' '}
                      </Fragment>
                    ))}
                  </p>
                </ScrollReveal>
              )}
            </div>
          </div>

          <div className="relative flex w-full flex-col items-center gap-[2.5svh] sm:gap-7">
            <ScrollReveal progress={p} at={0.56}>
              <Deadline call={call} draw={draw} />
            </ScrollReveal>
            <div inert={!actionsShown}>
              <ScrollReveal progress={p} at={0.8}>
                <CallActions onSky />
              </ScrollReveal>
            </div>
          </div>

          {/* A line drawing itself downward: there is more below */}
          <motion.div style={{ opacity: hint }} aria-hidden="true" className="absolute bottom-5 left-1/2 h-12 w-px overflow-hidden">
            <motion.span
              className="block h-full w-full bg-white/60 origin-top"
              animate={{ scaleY: [0, 1, 1], opacity: [1, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StackedSheet = ({ call, hero }: { call: OpenCall; hero: Hero }) => (
  <section className="p-2 sm:p-4">
    <motion.div
      className={`relative overflow-hidden rounded-sm shadow-page px-5 sm:px-8 pt-10 text-center text-white ${
        // Room in the corner for the figure, when there is one
        hero.figure ? 'pb-[70vw] sm:pb-[50vw] lg:pb-[30rem]' : 'pb-10'
      }`}
      style={{ background: hero.background }}
      {...revealGroup}
    >
      <div aria-hidden="true" className="sky-drift"><span /></div>
      {hero.figure && (
        <img
          src={getAssetPath(hero.figure)}
          alt=""
          className="absolute right-0 bottom-0 w-[66vw] sm:w-[48vw] max-w-lg pointer-events-none select-none"
        />
      )}
      {/* Above the figure, whose glow may reach up behind the button */}
      <div className="relative">
        <motion.div variants={revealItem}>
          <Masthead call={call} onSky />
        </motion.div>
        <motion.img variants={revealItem} src={getAssetPath(hero.title)} alt={call.theme} className="mx-auto mt-16 w-full max-w-2xl" />
        {call.definition && (
          <motion.p variants={revealItem} className="mx-auto mt-4 max-w-md text-balance italic font-light text-lg text-white/85">
            {call.definition}
          </motion.p>
        )}
        {call.prompt && (
          <motion.p variants={revealItem} className="mx-auto mt-10 max-w-xl text-balance text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
            “{call.prompt}”
          </motion.p>
        )}
        <motion.div variants={revealItem} className="mt-16">
          <Deadline call={call} />
        </motion.div>
        <motion.div variants={revealItem} className="mt-7">
          <CallActions onSky />
        </motion.div>
      </div>
    </motion.div>
  </section>
);

// Fallback when a call has no cut pieces: the whole poster, standing in front
// of the theme set large, on one centred axis.
const PosterHero = ({ call }: { call: OpenCall }) => (
  <motion.section className="overflow-hidden px-5 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-4 text-center text-ink" {...revealGroup}>
    <motion.div variants={revealItem}>
      <Masthead call={call} />
    </motion.div>
    <motion.h2
      variants={revealItem}
      className="mt-6 whitespace-nowrap text-[clamp(2.5rem,14vw,12rem)] font-semibold tracking-tighter leading-none"
    >
      {call.theme}
    </motion.h2>
    <motion.div variants={revealItem} className="relative z-10 -mt-[6vw] flex justify-center">
      <Link to="/submission" className="block w-[72%] max-w-sm">
        <Poster call={call} className="w-full aspect-[1/1.414]" />
      </Link>
    </motion.div>
    {call.prompt && (
      <motion.p variants={revealItem} className="mx-auto mt-8 max-w-xl text-balance text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
        “{call.prompt}”
      </motion.p>
    )}
    <motion.div variants={revealItem} className="mt-12">
      <Deadline call={call} />
    </motion.div>
    <motion.div variants={revealItem} className="mt-7">
      <CallActions />
    </motion.div>
  </motion.section>
);

// The head of the cover: the magazine's name, ruled off from the issue the
// call is for. Set in type rather than the wordmark, which doesn't read on
// the sky (and is in the nav bar just above). `onSky` sets it in light on the
// call's sheet; otherwise it sits on the page in ink.
const Masthead = ({ call, onSky = false, className = '' }: { call: OpenCall; onSky?: boolean; className?: string }) => (
  <p
    className={`flex items-center justify-center gap-3 sm:gap-4 text-[12px] sm:text-sm font-medium uppercase tracking-[0.25em] ${
      onSky ? 'text-white' : 'text-ink'
    } ${className}`}
  >
    <span>The Reuby</span>
    <span aria-hidden="true" className={`h-4 sm:h-5 w-px ${onSky ? 'bg-white/45' : 'bg-ink/25'}`} />
    <span>{call.issue ?? call.title}</span>
  </p>
);

// The foot of the cover: that the call is open now (the pulsing dot), right
// beside the way in. Side by side on wider screens, stacked on phones.
const CallActions = ({ onSky = false }: { onSky?: boolean }) => (
  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
    {/* On wider screens an outlined capsule the height of the button, so the
        two read as a pair */}
    <p
      className={`inline-flex items-center gap-2.5 sm:gap-3 text-[12px] sm:h-14 sm:rounded-full sm:px-7 sm:text-[15px] font-medium uppercase tracking-[0.18em] sm:tracking-[0.16em] sm:ring-1 sm:ring-inset ${
        onSky ? 'text-white sm:bg-white/10 sm:ring-white/45 sm:backdrop-blur-sm' : 'text-accent sm:bg-accent/5 sm:ring-accent/30'
      }`}
    >
      <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping motion-reduce:animate-none" />
        <span className="relative inline-flex h-full w-full rounded-full bg-current" />
      </span>
      Submissions open
    </p>
    <GuidelinesButton onSky={onSky} />
  </div>
);

// A loop of pen drawn round a date, as you would ring a day on a calendar:
// slightly uneven, and running on past where it began
const RING_PATH = 'M 94 16 C 72 2, 22 4, 9 30 C -3 55, 30 77, 64 75 C 99 73, 118 52, 109 29 C 102 12, 78 6, 56 9';

// The deadline on one line (stacked on phones), its day ringed in pen. As it is
// drawn the pen goes round the day. Pinned layouts drive the drawing with
// `draw` (0–1); elsewhere it draws once in view. The pen runs through the
// colours of the theme's lettering; text takes its colour from the surface.
const Deadline = ({ call, draw }: { call: OpenCall; draw?: MotionValue<number> }) => {
  const { deadline } = callDetails(call);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });
  const reduceMotion = useReducedMotion();
  const own = useMotionValue(0);
  useEffect(() => {
    if (draw) return;
    if (reduceMotion) own.set(1);
    else if (inView) animate(own, 1, { duration: 1.8, ease: EASE_OUT });
  }, [draw, inView, reduceMotion, own]);
  const progress = draw ?? own;

  const palette = call.hero?.palette ?? [];
  const gradientId = `pen-${useId()}`;
  const pen = useTransform(progress, [0, 0.75], [0, 1]);
  const penShown = useTransform(pen, [0, 0.02], [0, 1]);
  // "13 March 2027": the day is ringed, the month and year follow
  const [day, ...monthYear] = deadline.split(' ');

  return (
    <div ref={ref} className="flex flex-col sm:flex-row items-center justify-center gap-y-[1svh] gap-x-7">
      <p className="text-[11px] sm:text-sm uppercase tracking-[0.25em] opacity-80">Deadline</p>
      <p className="whitespace-nowrap text-[clamp(1.5rem,4.4svh,2.1rem)] sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-none">
        {/* Room after the day so the ring clears the month */}
        <span className="relative inline-block px-[0.14em] mr-[0.14em]">
          {day}
          <svg
            viewBox="0 0 120 80"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[0.32em] -inset-y-[0.26em] h-[calc(100%+0.52em)] w-[calc(100%+0.64em)] overflow-visible"
          >
            {palette.length > 1 && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  {palette.map((c, i) => (
                    <stop key={i} offset={i / (palette.length - 1)} stopColor={c} />
                  ))}
                </linearGradient>
              </defs>
            )}
            <motion.path
              d={RING_PATH}
              fill="none"
              stroke={palette.length > 1 ? `url(#${gradientId})` : palette[0] ?? 'currentColor'}
              strokeWidth={2.6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: pen, opacity: penShown }}
            />
          </svg>
        </span>{' '}
        {monthYear.join(' ')}
      </p>
    </div>
  );
};

// To the guidelines (the Submission page, which also has the email to send
// work to): a capsule, with the arrow set in its own disc
const GuidelinesButton = ({ onSky = false }: { onSky?: boolean }) => (
  <Link
    to="/submission"
    className={`group inline-flex items-center gap-4 rounded-full py-2 pl-7 pr-2 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${
      onSky
        ? 'bg-white text-[#1c1816] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-transparent'
        : 'bg-accent text-paper hover:bg-ink focus-visible:ring-accent focus-visible:ring-offset-desk'
    }`}
  >
    Read the guidelines
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${
        onSky ? 'bg-[#1c1816] text-white' : 'bg-paper text-accent'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-6-6 6 6-6 6" />
      </svg>
    </span>
  </Link>
);

const Poster = ({ call, className }: { call: OpenCall; className: string }) => {
  // The poster's space is reserved up front; it only wipes in once it has loaded
  const [loaded, setLoaded] = useState(false);
  const poster = call.posters?.[0];
  if (!poster) return null;
  return (
    <motion.img
      variants={wipe}
      initial="hidden"
      animate={loaded ? 'show' : 'hidden'}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      src={getAssetPath(poster.src)}
      alt={poster.alt}
      className={`object-cover rounded-sm bg-paper shadow-page ${className}`}
    />
  );
};

// Fades and lifts its children in as the scroll passes `at` (0–1 of the section)
const ScrollReveal = ({ progress, at, children }: { progress: MotionValue<number>; at: number; children: ReactNode }) => {
  const opacity = useTransform(progress, [at, at + 0.06], [0, 1]);
  const y = useTransform(progress, [at, at + 0.06], [16, 0]);
  return <motion.div style={{ opacity, y }}>{children}</motion.div>;
};

// One word of the prompt, going from faint to full as it is "read"
const ReadWord = ({ progress, at, children }: { progress: MotionValue<number>; at: number; children: ReactNode }) => {
  const opacity = useTransform(progress, [at, at + 0.04], [0.3, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
};
