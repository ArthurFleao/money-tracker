import type { ReactElement } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { strings } from '@/shared/i18n/strings';
import { AppShell } from './layout/AppShell';
import { RootLayout, type RouteHandle } from './layout/RootLayout';
import { RouteErrorBoundary } from './layout/RouteErrorBoundary';
import { PlaceholderPage } from './routes/PlaceholderPage';

const { pages } = strings;

function placeholder(
  page: { title: string; description: string },
  phase: number,
): { element: ReactElement; handle: RouteHandle } {
  return {
    element: <PlaceholderPage title={page.title} description={page.description} phase={phase} />,
    handle: { title: page.title },
  };
}

/**
 * Route table (PLAN.md §6.1). Placeholders are replaced by lazy feature routes
 * as each phase lands. Every route renders inside an error boundary; screens
 * inside the shell get their own so the navigation stays usable on errors.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/welcome',
        errorElement: <RouteErrorBoundary />,
        ...placeholder(pages.welcome, 3),
      },
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            errorElement: <RouteErrorBoundary />,
            children: [
              { index: true, ...placeholder(pages.dashboard, 6) },
              { path: 'wallets', ...placeholder(pages.wallets, 3) },
              { path: 'transactions', ...placeholder(pages.transactions, 4) },
              { path: 'recurring', ...placeholder(pages.recurring, 5) },
              { path: 'forecast', ...placeholder(pages.forecast, 6) },
              { path: 'settings', ...placeholder(pages.settings, 7) },
              {
                path: '*',
                element: (
                  <PlaceholderPage
                    title={pages.notFound.title}
                    description={pages.notFound.description}
                  />
                ),
                handle: { title: pages.notFound.title } satisfies RouteHandle,
              },
            ],
          },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
