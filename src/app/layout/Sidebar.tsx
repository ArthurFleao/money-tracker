import { NavLink } from 'react-router';
import { strings } from '@/shared/i18n/strings';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { cn } from '@/shared/utils/cn';
import { SIDEBAR_ITEMS } from './navItems';

export function Sidebar() {
  return (
    <aside className="border-border bg-surface/60 sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-4 py-6 backdrop-blur md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span
          aria-hidden="true"
          className="from-accent to-accent-2 shadow-glow size-8 rounded-md bg-linear-to-br"
        />
        <span className="text-base font-semibold tracking-tight">{strings.app.name}</span>
      </div>

      <nav aria-label={strings.nav.primaryLabel} className="mt-8 flex-1">
        <ul className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-accent/12 text-text'
                      : 'text-text-muted hover:bg-text/5 hover:text-text',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      aria-hidden="true"
                      className={cn('size-4.5', isActive ? 'text-accent' : 'text-current')}
                    />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <ThemeToggle className="self-start" />
    </aside>
  );
}
