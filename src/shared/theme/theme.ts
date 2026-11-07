export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** localStorage key. Also read by the inline no-flash script in index.html. */
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
 * Reads the stored preference, falling back to `'system'` when missing,
 * invalid or when storage is unavailable.
 *
 * @example
 * readStoredPreference(localStorage); // 'system' on first visit
 */
export function readStoredPreference(storage: Pick<Storage, 'getItem'>): ThemePreference {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
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
