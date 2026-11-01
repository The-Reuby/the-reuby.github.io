import type { Variants } from 'framer-motion';

// Shared scroll-reveal presets. Spread onto any motion element, e.g.
//   <motion.section {...reveal}>…</motion.section>
//   <motion.div {...revealGroup}>{items.map(i => <motion.div variants={revealItem} />)}</motion.div>
// Reduced-motion users are handled globally by <MotionConfig reducedMotion="user"> in App.

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Fire once, a little before the element is fully on screen
const viewport = { once: true, margin: '0px 0px -60px 0px' } as const;

export const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.6, ease: EASE_OUT },
};

export const revealGroup = {
  initial: 'hidden',
  whileInView: 'show',
  viewport,
  variants: {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  } satisfies Variants,
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};
