import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DARK_SCHEME_QUERY,
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/shared/theme/theme';
import { ThemeContext, type ThemeContextValue } from '@/shared/theme/useTheme';

export interface ThemeProviderProps {
  children: ReactNode;
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

/**
 * Owns the theme preference: persists it, follows the OS setting when the
 * preference is `system`, and applies the `.dark` class to `<html>`.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference(window.localStorage),
  );
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mql = window.matchMedia(DARK_SCHEME_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  }, []);

  const resolvedTheme = resolveTheme(preference, prefersDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode, quota); the theme still applies for the session.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
