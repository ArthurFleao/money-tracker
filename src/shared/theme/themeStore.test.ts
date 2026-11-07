import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from './theme';
import { useThemeStore } from './themeStore';

function persist(value: unknown) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ state: value, version: 1 }));
}

describe('useThemeStore', () => {
  it('defaults to system', () => {
    expect(useThemeStore.getState().preference).toBe('system');
  });

  it('persists the preference to localStorage', () => {
    act(() => {
      useThemeStore.getState().setPreference('dark');
    });
    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}') as {
      state: { preference: string };
    };
    expect(stored.state).toEqual({ preference: 'dark' });
  });

  it('rehydrates a valid stored preference', async () => {
    persist({ preference: 'light' });
    await useThemeStore.persist.rehydrate();
    expect(useThemeStore.getState().preference).toBe('light');
  });

  it.each([{ preference: 'neon' }, { other: true }, null, 'dark'])(
    'ignores invalid stored state %j',
    async (state) => {
      persist(state);
      await useThemeStore.persist.rehydrate();
      expect(useThemeStore.getState().preference).toBe('system');
    },
  );
});
