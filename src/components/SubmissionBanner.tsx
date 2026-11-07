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

// Poster wipes in from the right once loaded, like a page being revealed
const wipe: Variants = {
  hidden: { clipPath: 'inset(0 0 0 100%)' },
  show: { clipPath: 'inset(0 0 0 0%)', transition: { duration: 0.9, ease: EASE_OUT } },
};

// The call's strapline, run across the top of the home page like the line
// across a magazine cover.
export const SubmissionTicker = ({ call }: { call: OpenCall }) => {
  const days = daysUntil(call.deadline);
  const daysLeft = days === 0 ? 'Last day!' : `${days} day${days === 1 ? '' : 's'} left`;
  const deadline = formatDeadline(call.deadline);
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
// the middle with its definition and the prompt beneath, then, in their place,
// the deadline and the invitation, on a sheet coloured like the poster's sky.
// On every screen the sheet holds still while the two turn like pages under
// the lettering; anyone who prefers reduced motion gets them all at once.
// Without cut pieces, the whole poster stands in for them.
export const SubmissionHero = ({ call }: { call: OpenCall }) => {
  const reduceMotion = useReducedMotion();
  if (!call.hero) return <PosterHero call={call} />;
  return reduceMotion ? <StackedSheet call={call} hero={call.hero} /> : <PinnedSheet call={call} hero={call.hero} />;
};

type Hero = NonNullable<OpenCall['hero']>;

// What the sheet shows: the lettering alone in the very middle, then what the
// theme asks beneath it, then the call itself
type Stage = 'title' | 'theme' | 'call';

// How far into the sheet's run (0–1) a scroll turns to each page, a flick of
// the wheel or thumb, and between them the stretch over which the prompt is
// read, word by word, as you scroll: two or three steps of the wheel
const THEME_AT = 0.05;
const READ_FROM = 0.1;
const READ_TO = 0.36;
const CALL_AT = 0.44;
const stageAt = (v: number): Stage => (v < THEME_AT ? 'title' : v < CALL_AT ? 'theme' : 'call');

// What the theme asks, as a whole: lifting away as the call takes over, and
// back in place (behind its lines, already gone) if you scroll back to the top
const themePage: Variants = {
  title: { opacity: 1, y: 0, transition: { delay: 0.35, duration: 0 } },
  theme: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT, delayChildren: 0.35, staggerChildren: 0.2 } },
  call: { opacity: 0, y: -24, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
};
// Its lines, each fading and lifting in
const themeLine: Variants = {
  title: { opacity: 0, y: 16, transition: { duration: 0.3 } },
  theme: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};
// The call: arriving once the theme has gone, leaving quickly
const callLine = (delay: number): Variants => ({
  title: { opacity: 0, y: 16, transition: { duration: 0.25 } },
  theme: { opacity: 0, y: 16, transition: { duration: 0.25 } },
  call: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay } },
});
const callOpen = callLine(0.3);
const callAction = callLine(0.6);

const PinnedSheet = ({ call, hero }: { call: OpenCall; hero: Hero }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // The sheet opens on the lettering alone, in the very middle. A short
  // scroll and it rises as the definition and the prompt arrive beneath it;
  // a few more read the prompt word by word; another, and they leave, the
  // lettering steps back to a running head under the masthead, and the call
  // takes the middle of the page, its day ringed. Each turn plays through by
  // itself once reached, rather than only as far as you scroll, so it takes
  // short scrolls to see, not a long one. Scrolling back turns back.
  const [stage, setStage] = useState<Stage>('title');
  useMotionValueEvent(p, 'change', (v) => setStage(stageAt(v)));

  const sheetRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLImageElement>(null);
  const titleY = useMotionValue(0);
  const titleScale = useMotionValue(1);
  // Where the lettering opens (how far its resting place is above the middle
  // of the sheet), where the running head is and how small it is set
  const place = useRef({ middle: 0, head: 0, headScale: 0.5 });
  const titleAt = (s: Stage) =>
    s === 'title' ? { y: place.current.middle, scale: 1 } : s === 'theme' ? { y: 0, scale: 1 } : { y: place.current.head, scale: place.current.headScale };
  // Where the running head ends, so the call is centred in the room below it
  const headEnd = useMotionValue(0);
  const stageNow = useRef(stage);
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const zone = zoneRef.current;
    const title = titleRef.current;
    if (!sheet || !zone || !title) return;
    const measure = () => {
      // offsetTop ignores transforms, so this is where the lettering rests
      let top = 0;
      for (let el: HTMLElement | null = title; el && el !== sheet; el = el.offsetParent as HTMLElement | null) {
        top += el.offsetTop;
      }
      // At the `sm` breakpoint, where the lettering stops running full width
      const headScale = window.matchMedia('(min-width: 640px)').matches ? 0.48 : 0.6;
      const gap = sheet.clientHeight * 0.035;
      place.current = { middle: sheet.clientHeight / 2 - (top + title.offsetHeight / 2), head: zone.offsetTop + gap - top, headScale };
      headEnd.set(gap + title.offsetHeight * headScale);
      // Keep the lettering where the page has it, unless it is on its way
      if (titleY.isAnimating()) return;
      const at = titleAt(stageNow.current);
      titleY.set(at.y);
      titleScale.set(at.scale);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(title);
    return () => observer.disconnect();
  }, [titleY, titleScale, headEnd]);

  // Turn the page: move the lettering, and draw or clear the ring
  const draw = useMotionValue(0);
  useEffect(() => {
    if (stage === stageNow.current) return;
    stageNow.current = stage;
    const at = titleAt(stage);
    const move = { duration: 1, ease: EASE_OUT };
    const runs = [
      animate(titleY, at.y, move),
      animate(titleScale, at.scale, move),
      stage === 'call' ? animate(draw, 1, { delay: 0.55, duration: 1.2, ease: EASE_OUT }) : animate(draw, 0, { duration: 0.2 }),
    ];
    return () => runs.forEach((run) => run.stop());
  }, [stage, titleY, titleScale, draw]);

  const words = call.prompt?.split(' ') ?? [];
  const step = (READ_TO - READ_FROM) / Math.max(words.length, 1);

  return (
    // Long enough to hold each page a while; the turns are near the top
    <div ref={ref} className="relative h-[260vh]">
      <div className="sticky top-16 h-[calc(100svh-4rem)] p-2 sm:p-4">
        <motion.div
          ref={sheetRef}
          initial="title"
          animate={stage}
          className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-sm shadow-page px-5 pt-[5svh] pb-[4svh] text-center text-white sm:px-8 sm:pt-[6svh] sm:pb-[5svh]"
          style={{ background: hero.background }}
        >
          <div aria-hidden="true" className="sky-drift"><span /></div>
          {hero.figure && (
            <motion.img
              variants={{ title: { y: '70%' }, theme: { y: '0%', transition: { duration: 1.2, ease: EASE_OUT } } }}
              src={getAssetPath(hero.figure)}
              alt=""
              className="absolute right-0 bottom-0 h-[40%] sm:h-[52%] xl:h-[62%] w-auto pointer-events-none select-none"
            />
          )}

          <Masthead call={call} onSky className="relative" />

          {/* Two pages: the lettering with what the theme asks, then, once
              that has gone, the call, under the lettering set small */}
          <div ref={zoneRef} className="relative flex w-full min-h-0 flex-1 flex-col items-center justify-center pb-[4svh]">
            <motion.img
              ref={titleRef}
              style={{ y: titleY, scale: titleScale, transformOrigin: '50% 0%' }}
              src={getAssetPath(hero.title)}
              alt={call.theme}
              className="w-full sm:w-[68%] max-w-5xl"
            />
            <motion.div variants={themePage} className="flex flex-col items-center">
              {call.definition && (
                <motion.p
                  variants={themeLine}
                  className="mt-3 sm:mt-5 max-w-[19rem] sm:max-w-none text-balance italic text-[15px] leading-snug sm:font-light sm:text-[clamp(1rem,1.4vw,1.4rem)] text-white/85"
                >
                  {call.definition}
                </motion.p>
              )}
              {words.length > 0 && (
                <motion.p
                  variants={themeLine}
                  className="mt-[4svh] sm:mt-[5svh] max-w-[20rem] sm:max-w-[44rem] text-balance text-[clamp(1.4rem,3.9svh,1.9rem)] leading-[1.18] sm:text-[clamp(1.75rem,2.7vw,2.9rem)] sm:leading-tight font-semibold tracking-tight"
                >
                  {words.map((word, i) => (
                    <Fragment key={i}>
                      <ReadWord progress={p} from={READ_FROM + i * step} span={Math.max(step, 0.03)}>
                        {i === 0 ? '“' : ''}{word}{i === words.length - 1 ? '”' : ''}
                      </ReadWord>{' '}
                    </Fragment>
                  ))}
                </motion.p>
              )}
            </motion.div>

            {/* The call, on one centred axis in the room under the running
                head: open now, until when, the way in. Spaced by the screen's
                height too, so it fits a phone on its side; should it still not
                fit, it runs off the foot rather than over the head */}
            <motion.div
              style={{ top: headEnd }}
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-center [justify-content:safe_center] gap-[5svh] sm:gap-[min(3rem,6svh)] pb-[4svh] lg:pb-[calc(4svh_+_min(5rem,8svh)_-_min(2rem,4svh))]"
            >
              {/* On desktop "open" stands further above the deadline, up into
                  the room under the head; the extra space at the foot keeps
                  the deadline and the button where they were */}
              <motion.div variants={callOpen} className="flex flex-col items-center gap-[3svh] sm:gap-[min(2rem,4svh)] lg:gap-[min(5rem,8svh)]">
                <OpenNow onSky />
                <Deadline call={call} draw={draw} large />
              </motion.div>
              {/* Out of the tab order until it has arrived */}
              <motion.div variants={callAction} inert={stage !== 'call'} className="pointer-events-auto">
                <GuidelinesButton onSky />
              </motion.div>
            </motion.div>
          </div>

          {/* A line drawing itself downward, there is more below: under the
              lettering alone, and again once the prompt has arrived */}
          <motion.div
            variants={{
              title: { opacity: 1, transition: { delay: 0.6, duration: 0.6 } },
              theme: { opacity: [0, 0, 1], transition: { duration: 1.8, times: [0, 0.67, 1] } },
              call: { opacity: 0, transition: { duration: 0.2 } },
            }}
            aria-hidden="true"
            className="absolute bottom-5 left-1/2 h-12 w-px overflow-hidden"
          >
            <span className="block h-full w-full bg-white/60 origin-top animate-hint-draw" />
          </motion.div>
        </motion.div>
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
        <motion.div variants={revealItem} className="mt-16 flex flex-col items-center gap-5">
          <OpenNow onSky />
          <Deadline call={call} />
        </motion.div>
        <motion.div variants={revealItem} className="mt-7">
          <GuidelinesButton onSky />
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
    <motion.div variants={revealItem} className="mt-12 flex flex-col items-center gap-5">
      <OpenNow />
      <Deadline call={call} />
    </motion.div>
    <motion.div variants={revealItem} className="mt-7">
      <GuidelinesButton />
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

// That the call is open now: the words, after a small light that is on, its
// glow slowly breathing, as a lit window says someone is in
const OpenNow = ({ onSky = false }: { onSky?: boolean }) => (
  <p
    className={`inline-flex items-center gap-3 sm:gap-3.5 lg:gap-4 text-[17px] sm:text-xl lg:text-[1.75rem] font-medium tracking-tight ${
      onSky ? 'text-white' : 'text-accent'
    }`}
  >
    <span className="relative flex h-2.5 w-2.5 lg:h-3.5 lg:w-3.5" aria-hidden="true">
      {/* A CSS loop, so it runs off the main thread */}
      <span className="absolute -inset-1.5 rounded-full bg-current opacity-50 blur-[5px] animate-breathe motion-reduce:animate-none" />
      <span className="relative inline-flex h-full w-full rounded-full bg-current" />
    </span>
    Submissions open
  </p>
);

// A loop of pen drawn round a date, as you would ring a day on a calendar:
// slightly uneven, and running on past where it began
const RING_PATH = 'M 94 16 C 72 2, 22 4, 9 30 C -3 55, 30 77, 64 75 C 99 73, 118 52, 109 29 C 102 12, 78 6, 56 9';

// The deadline (on one line on wider screens), its day ringed in pen. As it is
// drawn the pen goes round the day. Pinned layouts drive the drawing with
// `draw` (0–1); elsewhere it draws once in view. The pen runs through the
// colours of the theme's lettering; text takes its colour from the surface.
// `large` sets it as the headline of a page of its own.
const Deadline = ({ call, draw, large = false }: { call: OpenCall; draw?: MotionValue<number>; large?: boolean }) => {
  const deadline = formatDeadline(call.deadline);
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
    // On wider screens one phrase, "Deadline" in a light weight at the date's
    // size; on phones, where that doesn't fit, a small label over the date
    <div
      ref={ref}
      className={`flex flex-col sm:flex-row items-center sm:items-baseline justify-center gap-y-[1svh] gap-x-[0.5em] ${
        large ? 'sm:text-[min(3rem,11svh)] lg:text-[min(3.75rem,11svh)] xl:text-[min(4.5rem,11svh)]' : 'sm:text-4xl lg:text-5xl'
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.25em] opacity-80 sm:text-[1em] sm:normal-case sm:tracking-tight sm:font-light sm:leading-none sm:opacity-75">
        Deadline
      </p>
      <p
        className={`whitespace-nowrap sm:text-[1em] font-semibold tracking-tight leading-none ${
          large ? 'text-[clamp(1.75rem,10vw,2.6rem)]' : 'text-[clamp(1.5rem,4.4svh,2.1rem)]'
        }`}
      >
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
    className={`group inline-flex items-center gap-4 sm:gap-5 rounded-full py-2 pl-7 pr-2 sm:pl-8 lg:py-2.5 lg:pl-9 lg:pr-2.5 text-[15px] sm:text-base lg:text-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${
      onSky
        ? 'bg-white text-[#1c1816] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-transparent'
        : 'bg-accent text-paper hover:bg-ink focus-visible:ring-accent focus-visible:ring-offset-desk'
    }`}
  >
    Read the guidelines
    <span
      className={`flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${
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

// One word of the prompt, going from faint to full as it is "read": over
// `span` of the scroll from `from`
const ReadWord = ({ progress, from, span, children }: { progress: MotionValue<number>; from: number; span: number; children: ReactNode }) => {
  const opacity = useTransform(progress, [from, from + span], [0.3, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
};
