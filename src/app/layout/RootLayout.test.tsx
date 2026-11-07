import { screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { RootLayout } from './RootLayout';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <RootLayout />,
        children: [
          { path: '/titled', element: <p>titled</p>, handle: { title: 'Wallets' } },
          { path: '/untitled', element: <p>untitled</p> },
          { path: '/bad-handle', element: <p>bad</p>, handle: { title: 42 } },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return renderWithProviders(<RouterProvider router={router} />);
}

describe('RootLayout', () => {
  it('renders the matched child route', async () => {
    renderAt('/titled');
    expect(await screen.findByText('titled')).toBeInTheDocument();
  });

  it('suffixes the route title with the app name', async () => {
    renderAt('/titled');
    await screen.findByText('titled');
    expect(document.title).toBe('Wallets · Money Tracker');
  });

  it.each(['/untitled', '/bad-handle'])('falls back to the app name for %s', async (path) => {
    document.title = 'stale';
    renderAt(path);
    await screen.findByRole('paragraph');
    expect(document.title).toBe('Money Tracker');
  });
});
