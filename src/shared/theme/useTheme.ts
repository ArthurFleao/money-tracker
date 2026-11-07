import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { DARK_SCHEME_QUERY, resolveTheme, type ResolvedTheme, type ThemePreference } from './theme';
import { useThemeStore } from './themeStore';

export interface UseThemeResult {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

/** Current theme preference, the theme actually applied (following the OS for `system`), and a setter. */
export function useTheme(): UseThemeResult {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const systemPrefersDark = useMediaQuery(DARK_SCHEME_QUERY);
  return { preference, resolvedTheme: resolveTheme(preference, systemPrefersDark), setPreference };
}
