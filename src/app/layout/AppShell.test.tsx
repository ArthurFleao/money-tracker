import { screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { routes } from '../router';
import { AppShell } from './AppShell';
import { RouteErrorBoundary } from './RouteErrorBoundary';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...renderWithProviders(<RouterProvider router={router} />) };
}

const primaryNav = () => screen.getByRole('navigation', { name: 'Primary' });
const mobileNav = () => screen.getByRole('navigation', { name: 'Main' });

describe('AppShell', () => {
  it('renders the dashboard at / and sets the document title', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Coming in Phase 6')).toBeInTheDocument();
    expect(document.title).toBe('Dashboard · Money Tracker');
  });

  it('navigates with the sidebar and marks the active link', async () => {
    const { user } = renderAt('/');
    await user.click(within(primaryNav()).getByRole('link', { name: 'Wallets' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Wallets' })).toBeInTheDocument();
    expect(within(primaryNav()).getByRole('link', { name: 'Wallets' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(primaryNav()).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(document.title).toBe('Wallets · Money Tracker');
  });

  it.each([
    ['/transactions', 'Transactions'],
    ['/recurring', 'Recurring'],
    ['/forecast', 'Plan ahead'],
    ['/settings', 'Settings'],
  ])('renders a placeholder for %s', async (path, title) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('offers the mobile tab bar with quick add', async () => {
    const { user } = renderAt('/');
    const nav = mobileNav();
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Transactions', 'Recurring', 'Plan ahead']);

    await user.click(within(nav).getByRole('button', { name: 'Quick add' }));
    expect(await screen.findByText('Quick add is coming soon.')).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'Plan ahead' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Plan ahead' }),
    ).toBeInTheDocument();
  });

  it('links to settings from the mobile top bar', async () => {
    const { user } = renderAt('/');
    const settingsLinks = screen.getAllByRole('link', { name: 'Settings' });
    const topBarLink = settingsLinks.find((link) => !primaryNav().contains(link));
    expect(topBarLink).toBeDefined();
    if (topBarLink) await user.click(topBarLink);
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('provides a skip link to the main landmark', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('shows a not-found page for unknown routes', async () => {
    renderAt('/does-not-exist');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Coming in Phase/)).not.toBeInTheDocument();
  });

  it('renders onboarding outside the shell', async () => {
    renderAt('/welcome');
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    expect(document.title).toBe('Welcome · Money Tracker');
  });

  it('keeps the navigation usable when a screen crashes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Boom(): never {
      throw new Error('kaboom');
    }
    const router = createMemoryRouter([
      {
        path: '/',
        element: <AppShell />,
        children: [
          { errorElement: <RouteErrorBoundary />, children: [{ index: true, element: <Boom /> }] },
        ],
      },
    ]);
    renderWithProviders(<RouterProvider router={router} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(within(primaryNav()).getByRole('link', { name: 'Wallets' })).toBeInTheDocument();
  });
});
