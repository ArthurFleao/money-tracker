import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/shared/utils/safeStorage';
import { isThemePreference, THEME_STORAGE_KEY, type ThemePreference } from './theme';

export interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

function persistedPreference(persisted: unknown): ThemePreference | undefined {
  if (typeof persisted !== 'object' || persisted === null || !('preference' in persisted)) {
    return undefined;
  }
  return isThemePreference(persisted.preference) ? persisted.preference : undefined;
}

/**
 * Theme UI state (PLAN.md §5.5), persisted to localStorage. Invalid persisted
 * values fall back to `'system'`.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        set({ preference });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: ({ preference }) => ({ preference }),
      merge: (persisted, current) => {
        const preference = persistedPreference(persisted);
        return preference ? { ...current, preference } : current;
      },
    },
  ),
);
