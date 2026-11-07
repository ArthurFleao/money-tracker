import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/shared/theme/useTheme';

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Applies the resolved theme to `<html>` (`.dark` class + `color-scheme`).
 * State lives in `useThemeStore`; the inline script in index.html applies the
 * stored theme before first paint.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return children;
}
