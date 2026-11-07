import { animate } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { DURATION, EASE_OUT } from '@/shared/motion/transitions';
import { usePrefersReducedMotion } from '@/shared/motion/usePrefersReducedMotion';
import { cn } from '@/shared/utils/cn';

export interface AnimatedNumberProps {
  /** Integer value, e.g. an amount in minor units. Intermediate frames are rounded. */
  value: number;
  /** Formats the (integer) value for display, e.g. `(minor) => money.format(minor, 'USD')`. */
  format?: (value: number) => string;
  /** Count up from 0 on mount (hero numbers). */
  animateOnMount?: boolean;
  /** Tween duration in seconds; capped at 0.6 s (PLAN.md §7.3). */
  duration?: number;
  /** Flash the income/expense color when the value goes up/down. */
  flash?: boolean;
  className?: string;
}

const MAX_DURATION = 0.6;
const FLASH_MS = 600;
const defaultFormat = (value: number) => String(value);

/**
 * Tweens between values with tabular figures so the width never jitters.
 * Screen readers only get the final value; the animated text is hidden from them.
 * Under `prefers-reduced-motion` the value updates instantly.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  animateOnMount = false,
  duration = DURATION.expressive,
  flash = true,
  className,
}: AnimatedNumberProps) {
  const visibleRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef<number | undefined>(undefined);
  const previousValueRef = useRef<number | undefined>(undefined);
  const formatRef = useRef(format);
  const reduceMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    formatRef.current = format;
  });

  useLayoutEffect(() => {
    const node = visibleRef.current;
    if (!node) return;

    const render = (current: number) => {
      shownRef.current = current;
      node.textContent = formatRef.current(current);
    };

    const previousValue = previousValueRef.current;
    previousValueRef.current = value;
    const from = shownRef.current ?? (animateOnMount ? 0 : value);

    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    if (flash && previousValue !== undefined && previousValue !== value) {
      node.dataset.trend = value > previousValue ? 'up' : 'down';
      flashTimer = setTimeout(() => {
        delete node.dataset.trend;
      }, FLASH_MS);
    }

    if (from === value || reduceMotion) {
      render(value);
      return () => {
        clearTimeout(flashTimer);
      };
    }

    render(from);
    const controls = animate(from, value, {
      duration: Math.min(duration, MAX_DURATION),
      ease: EASE_OUT,
      onUpdate: (latest) => {
        render(Math.round(latest));
      },
      onComplete: () => {
        render(value);
      },
    });
    return () => {
      controls.stop();
      clearTimeout(flashTimer);
    };
  }, [value, reduceMotion, duration, flash, animateOnMount]);

  return (
    <span className={cn('tabular-nums', className)}>
      <span
        ref={visibleRef}
        aria-hidden="true"
        data-slot="animated-number"
        className="data-[trend=down]:text-expense data-[trend=up]:text-income transition-colors duration-500"
      />
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
