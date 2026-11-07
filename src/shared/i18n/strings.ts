/**
 * Every user-facing string lives here (en-US). Adding i18n later means
 * replacing this module, not hunting strings across the codebase.
 */
export const strings = {
  app: {
    name: 'Money Tracker',
    tagline: 'See what you have, what is coming, and where you are headed.',
  },
  common: {
    close: 'Close',
    loading: 'Loading…',
  },
  theme: {
    legend: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  nav: {
    primaryLabel: 'Primary',
    mobileLabel: 'Main',
    skipToContent: 'Skip to content',
    dashboard: 'Dashboard',
    wallets: 'Wallets',
    transactions: 'Transactions',
    recurring: 'Recurring',
    forecast: 'Plan ahead',
    settings: 'Settings',
    quickAdd: 'Quick add',
  },
  pages: {
    dashboard: {
      title: 'Dashboard',
      description: 'Net worth, this month, upcoming items and your forecast at a glance.',
    },
    wallets: {
      title: 'Wallets',
      description: 'Every place your money lives, with live balances.',
    },
    transactions: {
      title: 'Transactions',
      description: 'One-time earnings and debts, grouped by day.',
    },
    recurring: {
      title: 'Recurring',
      description: 'Salaries, rent, subscriptions — everything that repeats.',
    },
    forecast: {
      title: 'Plan ahead',
      description: 'Your projected balance, day by day, with danger zones.',
    },
    settings: {
      title: 'Settings',
      description: 'Household, currency, theme and your data.',
    },
    welcome: {
      title: 'Welcome',
      description: 'Name your household, pick a currency and add your first wallet.',
    },
    notFound: {
      title: 'Page not found',
      description: 'The page you are looking for does not exist.',
    },
  },
  placeholder: {
    comingIn: (phase: number) => `Coming in Phase ${phase}`,
  },
  quickAdd: {
    comingSoon: 'Quick add is coming soon.',
  },
  errors: {
    title: 'Something went wrong',
    description: 'This screen hit an unexpected error. Your data is safe.',
    retry: 'Try again',
    goHome: 'Go to dashboard',
  },
} as const;
