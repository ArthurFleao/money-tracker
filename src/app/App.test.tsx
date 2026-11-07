import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { App } from './App';

describe('App', () => {
  it('renders the app title', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Money Tracker' })).toBeInTheDocument();
  });
});
