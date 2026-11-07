export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/**
 * localStorage key of the persisted theme store. Also read by the inline
 * no-flash script in index.html — keep both in sync.
 */
export const THEME_STORAGE_KEY = 'money-tracker:theme';

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Type guard for values read from storage.
 *
 * @example
 * isThemePreference('dark'); // true
 * isThemePreference('blue'); // false
 */
export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/**
 * Resolves a preference to the theme that should actually be applied.
 *
 * @example
 * resolveTheme('system', true); // 'dark'
 * resolveTheme('light', true);  // 'light'
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
