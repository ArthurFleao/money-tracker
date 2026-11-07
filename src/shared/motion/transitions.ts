import type { Variants } from 'motion/react';

/** Motion durations in seconds (PLAN.md §7.3). Nothing on a critical path exceeds 0.6 s. */
export const DURATION = {
  micro: 0.15,
  standard: 0.24,
  expressive: 0.5,
} as const;

/** Expo-out cubic bezier used for entrances. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Page transition: fade + 8px rise on enter, quick fade on exit. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE_OUT } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.micro, ease: 'easeIn' } },
};
