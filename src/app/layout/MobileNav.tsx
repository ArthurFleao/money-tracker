import { Plus } from 'lucide-react';
import { NavLink } from 'react-router';
import { toast } from 'sonner';
import { strings } from '@/shared/i18n/strings';
import { cn } from '@/shared/utils/cn';
import { MOBILE_ITEMS_END, MOBILE_ITEMS_START, type NavItem } from './navItems';

function TabLink({ to, label, Icon }: NavItem) {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          cn(
            'flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium transition-colors duration-150',
            isActive ? 'text-accent' : 'text-text-muted hover:text-text',
          )
        }
      >
        <Icon aria-hidden="true" className="size-5" />
        {label}
      </NavLink>
    </li>
  );
}

/** Bottom tab bar for small screens (PLAN.md §6.1). */
export function MobileNav() {
  return (
    <nav
      aria-label={strings.nav.mobileLabel}
      className="border-border bg-surface/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center px-2">
        {MOBILE_ITEMS_START.map((item) => (
          <TabLink key={item.to} {...item} />
        ))}
        <li className="flex flex-1 justify-center">
          <button
            type="button"
            aria-label={strings.nav.quickAdd}
            onClick={() => toast(strings.quickAdd.comingSoon)}
            className="from-accent to-accent-2 text-accent-fg shadow-glow -mt-6 inline-flex size-14 items-center justify-center rounded-full bg-linear-to-br transition-transform duration-150 active:scale-95"
          >
            <Plus aria-hidden="true" className="size-6" />
          </button>
        </li>
        {MOBILE_ITEMS_END.map((item) => (
          <TabLink key={item.to} {...item} />
        ))}
      </ul>
    </nav>
  );
}
