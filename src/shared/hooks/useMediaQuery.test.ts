import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installMatchMediaMock } from '@/test/matchMedia';
import { useMediaQuery } from './useMediaQuery';

const WIDE = '(min-width: 768px)';

describe('useMediaQuery', () => {
  it('returns the current match and follows changes', () => {
    const media = installMatchMediaMock();
    const { result } = renderHook(() => useMediaQuery(WIDE));
    expect(result.current).toBe(false);

    act(() => {
      media.setMatches(WIDE, true);
    });
    expect(result.current).toBe(true);
  });

  it('resubscribes when the query changes and cleans up on unmount', () => {
    const media = installMatchMediaMock();
    media.setMatches('(min-width: 1024px)', true);
    const { result, rerender, unmount } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: WIDE },
    });
    expect(result.current).toBe(false);
    rerender({ query: '(min-width: 1024px)' });
    expect(result.current).toBe(true);
    unmount();
    expect(() => {
      media.setMatches('(min-width: 1024px)', false);
    }).not.toThrow();
  });
});
