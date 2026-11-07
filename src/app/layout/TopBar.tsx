import { Settings } from 'lucide-react';
import { Link } from 'react-router';
import { strings } from '@/shared/i18n/strings';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

/** Mobile header: brand, theme and settings. Hidden from `md` up where the sidebar takes over. */
export function TopBar() {
  return (
    <header className="border-border bg-bg/80 sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
      <Link to="/" className="flex min-h-11 items-center gap-2 rounded-md">
        <span
          aria-hidden="true"
          className="from-accent to-accent-2 size-7 rounded-md bg-linear-to-br"
        />
        <span className="text-sm font-semibold tracking-tight">{strings.app.name}</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          to="/settings"
          aria-label={strings.nav.settings}
          className="text-text-muted hover:text-text inline-flex size-11 items-center justify-center rounded-full"
        >
          <Settings aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </header>
  );
}
