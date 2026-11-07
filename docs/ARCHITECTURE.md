# Architecture

> Source of truth: [PLAN.md §5](../PLAN.md#5-architecture). This document
> explains how the code is organized today and is updated as phases land
> (Phase 0 and Phase 2 are the main owners).

## Layers

```
app/       routes, providers, layout shell            → may import anything
features/  one folder per feature (UI + hooks + state) → domain | data | shared
domain/    pure TS: schemas, money, dates, recurrence  → nothing from the app
data/      repository interfaces + adapters            → domain
shared/    design system, hooks, utils, i18n, motion   → domain
```

The import direction is **enforced by ESLint** (`eslint-plugin-boundaries`,
see `eslint.config.js`). `dexie` and `firebase` may only be imported from
`src/data/` (`no-restricted-imports`). `src/test/` holds test helpers and may
only be used by test files.

## Directory map

```
src/
├── app/
│   ├── main.tsx              entry: mounts <App/>, imports global styles
│   ├── App.tsx               AppProviders + RouterProvider
│   ├── router.tsx            route table (placeholders until each phase lands)
│   ├── providers/            AppProviders, ThemeProvider, Toaster
│   ├── layout/               RootLayout, AppShell, Sidebar, TopBar, MobileNav,
│   │                         AnimatedOutlet, RouteErrorBoundary, navItems
│   └── routes/               PlaceholderPage
├── domain/                   pure logic, 100 % covered (see docs/DOMAIN.md)
│   ├── index.ts              public API barrel (`@/domain`)
│   ├── dates/                YYYY-MM-DD helpers (timezone-free)
│   ├── money/                ISO 4217 table, integer arithmetic, format/parse
│   ├── schemas/              Zod schemas + inferred entity types
│   ├── recurrence/           Occurrence, expandSchedule, exceptions, markPosted
│   ├── balances/             computeWalletBalance, computeNetWorth
│   └── forecast/             buildForecast, summarizeMonth, upcoming
├── data/                     (Phase 2)
├── features/                 (Phase 3+)
├── shared/
│   ├── ui/                   design-system components (see docs/DESIGN.md)
│   ├── theme/                theme types, persisted Zustand store, useTheme
│   ├── motion/               durations, easing, variants, usePrefersReducedMotion
│   ├── hooks/                useMediaQuery
│   ├── i18n/strings.ts       every user-facing string (en-US)
│   └── utils/                cn, safeStorage
├── styles/                   Tailwind v4 tokens (index.css), fonts
└── test/                     setup, render helper, factories, fast-check arbitraries, mocks
```

`src/domain` is additionally linted to forbid UI/state/storage imports and
clock reads (`Date.now()`, `new Date()`, `Date()`, `performance.now()`); see
[ADR-0002](./adr/0002-dates-as-strings.md) and
[ADR-0003](./adr/0003-money-as-integer-minor-units.md).

## Routing

`src/app/router.tsx` defines a data router (`createBrowserRouter`):

```
RootLayout            document.title from route handle.title
├── /welcome          onboarding — full screen, no shell
└── /  AppShell       sidebar (md+), top bar + bottom tab bar (< md)
    └── (error boundary per screen, so navigation stays usable)
        ├── index            Dashboard
        ├── wallets, transactions, recurring, forecast, settings
        └── *                Not found
```

Every route declares `handle: { title }`. Screens are placeholders in
Phase 0; each phase swaps its placeholder for a lazily loaded feature route
(default export, per the conventions in PLAN.md §12).

Page transitions are handled by `AnimatedOutlet` (Motion `AnimatePresence`,
fade + 8 px rise, < 300 ms) and honour `prefers-reduced-motion` through the
global `MotionConfig reducedMotion="user"` in `AppProviders`.

## State

| Kind           | Where                                                             | Example                            |
| -------------- | ----------------------------------------------------------------- | ---------------------------------- |
| Persisted data | Repository subscriptions → `useSyncExternalStore` hooks (Phase 2) | wallets, transactions              |
| UI state       | Small Zustand store per concern, persisted only where useful      | `useThemeStore` (theme preference) |
| Derived data   | `useMemo` over subscriptions, computed by pure `domain` functions | balances, forecast                 |
| Environment    | `useMediaQuery` / `usePrefersReducedMotion`                       | OS dark mode, reduced motion       |

Theme: `useThemeStore` persists the preference (`light | dark | system`) to
`localStorage` through `safeStorage` (storage errors never break the UI).
`useTheme()` resolves it against the OS setting; `ThemeProvider` applies the
`.dark` class and `color-scheme` to `<html>`. An inline script in
`index.html` applies the stored theme before first paint (no flash).

## Providers

`AppProviders` (used by the app **and** by `renderWithProviders` in tests):
`ThemeProvider` → `MotionConfig` → `TooltipProvider` → children + `Toaster`.
`RepositoryProvider` and `TodayProvider` join in Phase 2.

## Data layer (Phase 2)

Repository pattern with adapters (`memory`, `dexie`, later `firebase`),
selected by `VITE_DATA_ADAPTER`. See PLAN.md §5.3–5.4. This section will be
expanded when the data layer lands.
