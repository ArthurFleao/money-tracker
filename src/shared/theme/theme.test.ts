import { describe, expect, it } from 'vitest';
import { isThemePreference, readStoredPreference, resolveTheme, THEME_STORAGE_KEY } from './theme';

describe('isThemePreference', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([null, undefined, '', 'blue', 1])('rejects %s', (value) => {
    expect(isThemePreference(value)).toBe(false);
  });
});

describe('readStoredPreference', () => {
  it('returns the stored preference when valid', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readStoredPreference(localStorage)).toBe('dark');
  });

  it('falls back to system when missing or invalid', () => {
    expect(readStoredPreference(localStorage)).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(readStoredPreference(localStorage)).toBe('system');
  });

  it('falls back to system when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(readStoredPreference(broken)).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('follows the system setting when preference is system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('uses an explicit preference regardless of the system', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
