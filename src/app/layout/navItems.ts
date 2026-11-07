import {
  ArrowLeftRight,
  CalendarSync,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { strings } from '@/shared/i18n/strings';

export interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS = {
  dashboard: { to: '/', label: strings.nav.dashboard, Icon: LayoutDashboard },
  wallets: { to: '/wallets', label: strings.nav.wallets, Icon: Wallet },
  transactions: { to: '/transactions', label: strings.nav.transactions, Icon: ArrowLeftRight },
  recurring: { to: '/recurring', label: strings.nav.recurring, Icon: CalendarSync },
  forecast: { to: '/forecast', label: strings.nav.forecast, Icon: TrendingUp },
  settings: { to: '/settings', label: strings.nav.settings, Icon: Settings },
} satisfies Record<string, NavItem>;

/** Desktop sidebar order. */
export const SIDEBAR_ITEMS: readonly NavItem[] = [
  NAV_ITEMS.dashboard,
  NAV_ITEMS.wallets,
  NAV_ITEMS.transactions,
  NAV_ITEMS.recurring,
  NAV_ITEMS.forecast,
  NAV_ITEMS.settings,
];

/** Mobile bottom bar: two items, the quick-add button, two items (PLAN.md §6.1). */
export const MOBILE_ITEMS_START: readonly NavItem[] = [NAV_ITEMS.dashboard, NAV_ITEMS.transactions];
export const MOBILE_ITEMS_END: readonly NavItem[] = [NAV_ITEMS.recurring, NAV_ITEMS.forecast];
