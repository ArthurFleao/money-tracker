import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installMatchMediaMock } from '@/test/matchMedia';
import { REDUCED_MOTION_QUERY, usePrefersReducedMotion } from './usePrefersReducedMotion';

describe('usePrefersReducedMotion', () => {
  it('is false by default', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('reflects the OS setting and live changes', () => {
    const media = installMatchMediaMock();
    media.setMatches(REDUCED_MOTION_QUERY, true);
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);

    act(() => {
      media.setMatches(REDUCED_MOTION_QUERY, false);
    });
    expect(result.current).toBe(false);
    unmount();
  });
});
