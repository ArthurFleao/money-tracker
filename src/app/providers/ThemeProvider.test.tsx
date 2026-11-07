import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DARK_SCHEME_QUERY, THEME_STORAGE_KEY } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { installMatchMediaMock } from '@/test/matchMedia';
import { ThemeProvider } from './ThemeProvider';

function renderUseTheme() {
  return renderHook(() => useTheme(), { wrapper: ThemeProvider });
}

const root = () => document.documentElement;

describe('ThemeProvider', () => {
  it('defaults to the system preference (light)', () => {
    const { result } = renderUseTheme();
    expect(result.current.preference).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(root()).not.toHaveClass('dark');
    expect(root().style.colorScheme).toBe('light');
  });

  it('applies dark when the system prefers dark', () => {
    installMatchMediaMock().setMatches(DARK_SCHEME_QUERY, true);
    const { result } = renderUseTheme();
    expect(result.current.resolvedTheme).toBe('dark');
    expect(root()).toHaveClass('dark');
  });

  it('reacts to live OS theme changes while on system', () => {
    const media = installMatchMediaMock();
    const { result } = renderUseTheme();
    act(() => {
      media.setMatches(DARK_SCHEME_QUERY, true);
    });
    expect(result.current.resolvedTheme).toBe('dark');
    expect(root()).toHaveClass('dark');
  });

  it('restores the stored preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const { result } = renderUseTheme();
    expect(result.current.preference).toBe('dark');
    expect(root()).toHaveClass('dark');
  });

  it('applies and persists a new preference', () => {
    const { result } = renderUseTheme();
    act(() => {
      result.current.setPreference('dark');
    });
    expect(root()).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    act(() => {
      result.current.setPreference('light');
    });
    expect(root()).not.toHaveClass('dark');
  });

  it('still applies the theme when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderUseTheme();
    act(() => {
      result.current.setPreference('dark');
    });
    expect(root()).toHaveClass('dark');
  });

  it('stops listening to the OS after unmount', () => {
    const media = installMatchMediaMock();
    const { unmount } = render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    unmount();
    expect(() => {
      media.setMatches(DARK_SCHEME_QUERY, true);
    }).not.toThrow();
    expect(root()).not.toHaveClass('dark');
  });
});

describe('useTheme', () => {
  it('throws outside a ThemeProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });
});
