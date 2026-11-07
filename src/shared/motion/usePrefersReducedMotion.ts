import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Live `prefers-reduced-motion` flag for imperative animations that
 * `MotionConfig reducedMotion="user"` does not cover (e.g. number tweens).
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
