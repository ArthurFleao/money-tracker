import { useEffect } from 'react';
import { Outlet, useMatches } from 'react-router';
import { strings } from '@/shared/i18n/strings';

/** Route `handle` shape: every screen declares its title for `document.title`. */
export interface RouteHandle {
  title: string;
}

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    typeof (handle as Partial<RouteHandle>).title === 'string'
  );
}

/** Sets `document.title` from the deepest route that declares `handle.title`. */
function useDocumentTitle() {
  const matches = useMatches();
  const title = matches
    .map((match) => match.handle)
    .filter(isRouteHandle)
    .at(-1)?.title;

  useEffect(() => {
    document.title = title ? `${title} · ${strings.app.name}` : strings.app.name;
  }, [title]);
}

/** Top-level route: concerns shared by every screen, with or without the app shell. */
export function RootLayout() {
  useDocumentTitle();
  return <Outlet />;
}
