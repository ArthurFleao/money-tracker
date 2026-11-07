import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installMatchMediaMock } from './matchMedia';
import { renderWithProviders } from './render';

describe('test environment', () => {
  it('provides IndexedDB through fake-indexeddb', () => {
    expect(globalThis.indexedDB).toBeDefined();
  });

  it('provides a controllable matchMedia mock', () => {
    const media = installMatchMediaMock();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const seen: boolean[] = [];
    mql.addEventListener('change', (event) => seen.push(event.matches));

    expect(mql.matches).toBe(false);
    media.setMatches('(prefers-color-scheme: dark)', true);
    expect(mql.matches).toBe(true);
    expect(seen).toEqual([true]);
  });
});

describe('renderWithProviders', () => {
  it('renders the element and returns a user-event instance', async () => {
    let clicks = 0;
    const { user } = renderWithProviders(
      <button type="button" onClick={() => (clicks += 1)}>
        Press
      </button>,
    );
    await user.click(screen.getByRole('button', { name: 'Press' }));
    expect(clicks).toBe(1);
  });

  it('nests an optional wrapper inside the providers', () => {
    renderWithProviders(<span>child</span>, {
      wrapper: ({ children }) => <section aria-label="outer">{children}</section>,
    });
    expect(screen.getByRole('region', { name: 'outer' })).toHaveTextContent('child');
  });
});
