import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '@/shared/theme/theme';
import { renderWithProviders } from '@/test/render';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('exposes a labelled group of Light / Dark / System options', () => {
    renderWithProviders(<ThemeToggle />);
    const group = screen.getByRole('group', { name: 'Theme' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('switches to dark and persists the choice', async () => {
    const { user } = renderWithProviders(<ThemeToggle />);
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toContain('"preference":"dark"');
  });

  it('is operable with the keyboard', async () => {
    const { user } = renderWithProviders(<ThemeToggle />);
    await user.click(screen.getByRole('radio', { name: 'Light' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement).toHaveClass('dark');
  });
});
