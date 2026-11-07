import { describe, expect, it } from 'vitest';
import { isThemePreference, resolveTheme } from './theme';

describe('isThemePreference', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([null, undefined, '', 'blue', 1])('rejects %s', (value) => {
    expect(isThemePreference(value)).toBe(false);
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
