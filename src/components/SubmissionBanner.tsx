import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
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

// The open call, as the first thing on the home page. When the call has
// pieces cut from its poster (`hero`), they are laid out again on a sheet
// coloured like the poster's sky: its lettering, its figure in the corner,
// and only what the poster can't say, the prompt and the time left. On every
// screen the sheet holds still while you scroll and the pieces arrive in
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

  // 0–0.05 the lettering alone · 0.05–0.28 it rises to the head of the sheet
  // as the figure comes up from the corner · 0.32 once it has settled, the
  // definition · 0.42–0.62 the prompt, word by word · 0.64 time left · 0.85
  // the invitation
  const titleY = useTransform(p, [0.05, 0.28], ['27vh', '0vh']);
  const titleScale = useTransform(p, [0.05, 0.28], [1.12, 1]);
  const figureY = useTransform(p, [0.05, 0.4], ['70%', '0%']);
  const hint = useTransform(p, [0, 0.04], [1, 0]);
  const words = call.prompt?.split(' ') ?? [];
  const step = 0.2 / Math.max(words.length, 1);

  // The days are drawn out, then the invitation follows
  const draw = useTransform(p, [0.66, 0.82], [0, 1]);

  // Keep the button out of the tab order until it has arrived
  const [actionsShown, setActionsShown] = useState(false);
  useMotionValueEvent(p, 'change', (v) => setActionsShown(v > 0.87));

  return (
    <div ref={ref} className="relative h-[320vh]">
      <div className="sticky top-16 h-[calc(100svh-4rem)] p-3 sm:p-4">
        {/* Head, prompt and foot share the sheet's height, so the same
            sequence fits a phone and a wide screen alike */}
        <div
          className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-sm shadow-page px-6 pt-[8svh] pb-[5svh] text-center text-white sm:px-8"
          style={{ background: hero.background }}
        >
          {hero.figure && (
            <motion.img
              style={{ y: figureY }}
              src={getAssetPath(hero.figure)}
              alt=""
              className="absolute right-0 bottom-0 h-[40%] sm:h-[52%] xl:h-[62%] w-auto pointer-events-none select-none"
            />
          )}

          <div className="relative flex w-full flex-col items-center">
            {/* What the sheet is travels with the lettering, from the first frame */}
            <motion.div style={{ y: titleY, scale: titleScale }} className="flex w-full flex-col items-center">
              <CallEyebrow call={call} className="mb-5 sm:mb-8 text-white/90" />
              <img src={getAssetPath(hero.title)} alt={call.theme} className="w-[88%] sm:w-[68%] max-w-5xl" />
            </motion.div>
            {call.definition && (
              <ScrollReveal progress={p} at={0.32}>
                <p className="mt-4 sm:mt-5 max-w-md sm:max-w-none italic font-light text-[clamp(1rem,1.4vw,1.4rem)] text-white/85">
                  {call.definition}
                </p>
              </ScrollReveal>
            )}
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            {words.length > 0 && (
              <ScrollReveal progress={p} at={0.38}>
                <p className="max-w-[40rem] text-[clamp(1.6rem,2.4vw,2.6rem)] font-semibold tracking-tight leading-tight">
                  {words.map((word, i) => (
                    <Fragment key={i}>
                      <ReadWord progress={p} at={0.42 + i * step}>
                        {i === 0 ? '“' : ''}{word}{i === words.length - 1 ? '”' : ''}
                      </ReadWord>{' '}
                    </Fragment>
                  ))}
                </p>
              </ScrollReveal>
            )}
          </div>

          <div className="relative flex w-full flex-col items-center">
            <div className="w-full sm:w-[min(52rem,80%)]">
              <ScrollReveal progress={p} at={0.64}>
                <TimeLeft call={call} draw={draw} />
              </ScrollReveal>
            </div>
            <div className="mt-7 sm:mt-8" inert={!actionsShown}>
              <ScrollReveal progress={p} at={0.85}>
                <SubmitButton onSky />
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
  <section className="p-3 sm:p-4">
    <motion.div
      className={`relative overflow-hidden rounded-sm shadow-page px-6 pt-14 text-center text-white ${
        // Room in the corner for the figure, when there is one
        hero.figure ? 'pb-[70vw] sm:pb-[50vw] lg:pb-[30rem]' : 'pb-14'
      }`}
      style={{ background: hero.background }}
      {...revealGroup}
    >
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
          <CallEyebrow call={call} className="mb-4 text-white/85" />
        </motion.div>
        <motion.img variants={revealItem} src={getAssetPath(hero.title)} alt={call.theme} className="mx-auto w-full max-w-2xl" />
        {call.definition && (
          <motion.p variants={revealItem} className="mx-auto mt-4 max-w-md italic font-light text-lg text-white/85">
            {call.definition}
          </motion.p>
        )}
        {call.prompt && (
          <motion.p variants={revealItem} className="mx-auto mt-10 max-w-xl text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
            “{call.prompt}”
          </motion.p>
        )}
        <motion.div variants={revealItem} className="mx-auto mt-12 max-w-2xl">
          <TimeLeft call={call} />
        </motion.div>
        <motion.div variants={revealItem} className="mt-8">
          <SubmitButton onSky />
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
      <CallEyebrow call={call} className="text-muted" />
    </motion.div>
    <motion.h2
      variants={revealItem}
      className="mt-3 whitespace-nowrap text-[clamp(2.5rem,14vw,12rem)] font-semibold tracking-tighter leading-none"
    >
      {call.theme}
    </motion.h2>
    <motion.div variants={revealItem} className="relative z-10 -mt-[6vw] flex justify-center">
      <Link to="/submission" className="block w-[72%] max-w-sm">
        <Poster call={call} className="w-full aspect-[1/1.414]" />
      </Link>
    </motion.div>
    {call.prompt && (
      <motion.p variants={revealItem} className="mx-auto mt-8 max-w-xl text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
        “{call.prompt}”
      </motion.p>
    )}
    <motion.div variants={revealItem} className="mx-auto mt-12 max-w-2xl">
      <TimeLeft call={call} />
    </motion.div>
    <motion.div variants={revealItem} className="mt-8">
      <SubmitButton />
    </motion.div>
  </motion.section>
);

// Says what the call is: open now (the pulsing dot), and for which issue.
// Takes its colour from the surface it sits on.
const CallEyebrow = ({ call, className = '' }: { call: OpenCall; className?: string }) => (
  <p className={`inline-flex items-center gap-3 sm:gap-4 text-sm sm:text-base lg:text-lg font-medium uppercase tracking-[0.22em] ${className}`}>
    <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping motion-reduce:animate-none" />
      <span className="relative inline-flex h-full w-full rounded-full bg-current" />
    </span>
    Submissions open · {call.issue ?? call.title}
  </p>
);

// The days between now and the deadline, drawn as a ruler: a tick for each
// day, a taller one where each month begins, full height at today and at the
// deadline. As it is drawn the count runs up to the days left. Pinned layouts
// drive the drawing with `draw` (0–1); elsewhere it draws once in view.
// Takes its colour from the surface it sits on.
const TimeLeft = ({ call, draw }: { call: OpenCall; draw?: MotionValue<number> }) => {
  const { days, daysLeft, deadline } = callDetails(call);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });
  const reduceMotion = useReducedMotion();
  const own = useMotionValue(0);
  useEffect(() => {
    if (draw) return;
    if (reduceMotion) own.set(1);
    else if (inView) animate(own, 1, { duration: 1.6, ease: EASE_OUT });
  }, [draw, inView, reduceMotion, own]);
  const progress = draw ?? own;
  const count = useTransform(progress, (v) => Math.round(v * days));
  // A couple of pixels of slack keeps the end ticks whole
  const clip = useTransform(progress, (v) => `inset(-2px calc(${(1 - v) * 100}% - 2px) -2px -2px)`);

  if (days === 0) {
    return <p className="text-center text-5xl font-semibold tracking-tight">{daysLeft}</p>;
  }

  const today = new Date();
  const ticks = Array.from({ length: days + 1 }, (_, i) => {
    const end = i === 0 || i === days;
    const monthStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i).getDate() === 1;
    return { i, height: end ? 10 : monthStart ? 6.5 : 4, opacity: end ? 1 : monthStart ? 0.85 : 0.5 };
  });

  return (
    <div ref={ref}>
      <div className="flex items-end justify-between gap-6">
        <div className="text-left">
          <p aria-hidden="true" className="text-6xl sm:text-7xl font-semibold tracking-tight leading-none tabular-nums">
            <motion.span>{count}</motion.span>
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] opacity-80">
            <span className="sr-only">{days} </span>day{days === 1 ? '' : 's'} left
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg sm:text-2xl font-semibold tracking-tight leading-none">{deadline}</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] opacity-80">Deadline</p>
        </div>
      </div>
      <motion.svg
        style={{ clipPath: clip }}
        viewBox={`0 0 ${days} 10`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="mt-5 block h-8 w-full overflow-visible"
      >
        <line x1={0} x2={days} y1={10} y2={10} stroke="currentColor" strokeOpacity={0.3} vectorEffect="non-scaling-stroke" />
        {ticks.map((t) => (
          <line
            key={t.i}
            x1={t.i}
            x2={t.i}
            y1={10 - t.height}
            y2={10}
            stroke="currentColor"
            strokeOpacity={t.opacity}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </motion.svg>
    </div>
  );
};

// A capsule, with the arrow set in its own disc
const SubmitButton = ({ onSky = false }: { onSky?: boolean }) => (
  <Link
    to="/submission"
    className={`group inline-flex items-center gap-4 rounded-full py-2 pl-7 pr-2 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${
      onSky
        ? 'bg-white text-[#1c1816] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-transparent'
        : 'bg-accent text-paper hover:bg-ink focus-visible:ring-accent focus-visible:ring-offset-desk'
    }`}
  >
    Submit your work
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
