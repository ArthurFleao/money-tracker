import { TriangleAlert } from 'lucide-react';
import { isRouteErrorResponse, Link, useLocation, useNavigate, useRouteError } from 'react-router';
import { strings } from '@/shared/i18n/strings';

function describeError(error: unknown): string | undefined {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return undefined;
}

/** Route-level error UI: never a blank screen (PLAN.md §6.6). */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const detail = import.meta.env.DEV ? describeError(error) : undefined;

  return (
    <section
      role="alert"
      className="border-border bg-surface mx-auto mt-10 flex max-w-lg flex-col items-start gap-4 rounded-lg border p-6"
    >
      <TriangleAlert aria-hidden="true" className="text-danger size-6" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{strings.errors.title}</h1>
        <p className="text-text-muted text-sm">{strings.errors.description}</p>
        {detail ? (
          <pre className="text-text-muted mt-2 text-xs whitespace-pre-wrap">{detail}</pre>
        ) : null}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            // A fresh navigation to the same location resets the error state and re-runs loaders.
            void navigate(location, { replace: true });
          }}
          className="bg-accent text-accent-fg rounded-md px-4 py-2 text-sm font-medium"
        >
          {strings.errors.retry}
        </button>
        <Link to="/" className="text-accent rounded-md px-4 py-2 text-sm font-medium">
          {strings.errors.goHome}
        </Link>
      </div>
    </section>
  );
}
