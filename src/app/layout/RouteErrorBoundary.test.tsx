import { screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { RouteErrorBoundary } from './RouteErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

function renderWithError(route: RouteObject) {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const router = createMemoryRouter(
    [
      { path: '/', element: <h1>Home</h1> },
      { path: '/broken', errorElement: <RouteErrorBoundary />, ...route },
    ],
    { initialEntries: ['/broken'] },
  );
  return renderWithProviders(<RouterProvider router={router} />);
}

describe('RouteErrorBoundary', () => {
  it('replaces a crashing screen with an actionable alert', async () => {
    renderWithError({ element: <Boom /> });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).toHaveTextContent('kaboom');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('lets the user go back to the dashboard', async () => {
    const { user } = renderWithError({ element: <Boom /> });
    await user.click(await screen.findByRole('link', { name: 'Go to dashboard' }));
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('retries the current route', async () => {
    let broken = true;
    function Flaky() {
      if (broken) throw new Error('temporarily broken');
      return <h1>Recovered</h1>;
    }
    const { user } = renderWithError({ element: <Flaky /> });
    const retry = await screen.findByRole('button', { name: 'Try again' });
    broken = false;
    await user.click(retry);
    expect(await screen.findByRole('heading', { name: 'Recovered' })).toBeInTheDocument();
  });

  it('describes HTTP-style route errors', async () => {
    renderWithError({
      loader: () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Router's contract for HTTP errors
        throw new Response(null, { status: 404, statusText: 'Not Found' });
      },
      element: <h1>unreachable</h1>,
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('404 Not Found');
  });

  it('omits details for unknown thrown values', async () => {
    renderWithError({
      loader: () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- simulating a non-Error throw
        throw 'plain string';
      },
      element: <h1>unreachable</h1>,
    });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).not.toHaveTextContent('plain string');
  });

  it('hides technical details in production builds', async () => {
    vi.stubEnv('DEV', false);
    renderWithError({ element: <Boom /> });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).not.toHaveTextContent('kaboom');
  });
});
