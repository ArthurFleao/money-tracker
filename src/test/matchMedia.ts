import { vi } from 'vitest';

export interface MatchMediaMock {
  /** Change the result of every query matching `query` and notify listeners. */
  setMatches: (query: string, matches: boolean) => void;
}

/**
 * jsdom does not implement `window.matchMedia`. This installs a controllable
 * mock where every query starts as not matching.
 *
 * @example
 * const media = installMatchMediaMock();
 * media.setMatches('(prefers-color-scheme: dark)', true);
 */
export function installMatchMediaMock(): MatchMediaMock {
  const state = new Map<string, boolean>();
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();

  const matchMedia = vi.fn((query: string): MediaQueryList => {
    const queryListeners = listeners.get(query) ?? new Set();
    listeners.set(query, queryListeners);
    const mql = {
      get matches() {
        return state.get(query) ?? false;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        queryListeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        queryListeners.delete(listener);
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        queryListeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        queryListeners.delete(listener);
      },
      dispatchEvent: () => true,
    };
    return mql as unknown as MediaQueryList;
  });

  vi.stubGlobal('matchMedia', matchMedia);

  return {
    setMatches(query, matches) {
      state.set(query, matches);
      for (const listener of listeners.get(query) ?? []) {
        listener({ matches, media: query } as MediaQueryListEvent);
      }
    },
  };
}
