# Money Tracker — Project Plan

> **Audience:** this document is written for both humans and AI coding agents.
> It is the single source of truth for scope, architecture, conventions and the
> order in which things get built. Read it fully before writing any code.
> When a decision here conflicts with your instinct, follow this document and
> raise the disagreement in an ADR (see §12) instead of silently diverging.

---

## 0. Vision

A personal/household finance tracker that answers three questions at a glance:

1. **How much money do I have right now?** (wallets)
2. **What is coming in and going out, and when?** (recurring + one-time earnings and debts)
3. **Where will I be in 30/60/90 days?** (forecast / "plan ahead")

It must be **visually stunning** — a product people want to open every day —
while being **rigorously tested**, **well documented**, and **safe to open-source**.

### 0.1 Guiding principles

| Principle | What it means in practice |
|---|---|
| Local-first, cloud-ready | Runs 100% offline in the browser today; Firebase is a swap-in adapter later. No code outside `src/data/` may know how data is stored. |
| Domain logic is pure | Everything that computes money (balances, recurrence, forecasts) lives in `src/domain/` as pure TypeScript with **no React, no I/O, no Date.now()** — and is tested to 100%. |
| Every feature ships with tests | No PR without tests. Unit for logic, component for UI, e2e for user flows. CI blocks merges. |
| Motion with intent | Animations communicate state (money going up/down, items entering/leaving). Always respect `prefers-reduced-motion`. |
| Secrets never touch git | Config via env vars; `.env.local` is git-ignored; CI uses GitHub Secrets; secret scanning runs pre-commit and in CI. |
| Docs are part of the feature | A feature without docs is not done. |

---

## 1. Scope

### 1.1 MVP (must-have) — Phases 0–7

- **Wallets** — current money owned, one or more wallets (cash, checking, savings…), each with a balance derived from an initial balance + transactions.
- **Recurring earnings** — e.g. salary on the 5th, freelance retainer every 2 weeks.
- **Recurring debts** — fixed bills weekly/monthly/yearly (rent, subscriptions, loan installments).
- **One-time earnings** and **one-time debts** — ad-hoc transactions.
- **Dashboard** — net worth, month overview, upcoming items, charts.
- **Forecast ("plan ahead")** — projected balance per day for a horizon, with danger zones (balance < 0 or below a user-set floor).
- **Multi-currency selectable by user** — see §4.3 for the exact MVP interpretation.
- Dark + light mode, desktop and mobile-responsive layouts.
- Local persistence (IndexedDB) behind a repository interface.
- Full test suite + CI + documentation.

### 1.2 Firebase readiness — Phase 8

- Env-based config, Firebase Hosting config, Emulator Suite for local dev.
- Firebase Auth (Google sign-in) + **households** (multi-user sharing).
- Firestore adapter implementing the same repository interface.
- Firestore Security Rules with automated tests.
- CI deploy to Firebase Hosting from `main`.

### 1.3 Future (explicitly out of MVP, but the data model must not block them) — Phase 9+

- Categories & tags on transactions.
- Budgets (per category / per month) and goals.
- Savings targets with progress tracking.
- Per-transaction currencies with exchange rates.
- CSV/OFX import, CSV/JSON export.
- Installable PWA / offline sync.
- Notifications/reminders for upcoming bills.

---

## 2. Glossary (use these words everywhere: code, UI, docs)

| Term | Meaning | Code identifier |
|---|---|---|
| **Household** | The unit of data ownership. One or more members share a household's wallets and transactions. In MVP there is exactly one local household, created automatically. | `Household`, `householdId` |
| **Member** | A user belonging to a household. Only meaningful after auth (Phase 8). | `Member` |
| **Wallet** | A place where money is held (cash, bank account, savings). Has an initial balance and a currency. | `Wallet` |
| **Transaction** | A single dated movement of money in or out of a wallet. Can be one-time or materialized from a recurring rule. | `Transaction` with `kind: 'income' \| 'expense'` |
| **Earning** | UI word for an `income` transaction. | `kind: 'income'` |
| **Debt** | UI word for an `expense` transaction (bills, purchases, installments). | `kind: 'expense'` |
| **Recurring rule** | A template that generates occurrences on a schedule (salary, rent). | `RecurringRule` |
| **Occurrence** | One projected instance of a recurring rule on a specific date. Not persisted until it is *posted*. | `Occurrence` |
| **Posting** | Turning an occurrence into a real `Transaction` (automatically when its date arrives, or manually ahead of time). | `postOccurrence()` |
| **Exception** | A per-date override on a recurring rule: skip it or change its amount for that date. | `RecurrenceException` |
| **Forecast** | Projected balance per day over a horizon, combining current balance, future one-time transactions and unposted occurrences. | `Forecast`, `ForecastPoint` |
| **Floor** | User-defined minimum balance that triggers a warning in forecasts (default 0). | `balanceFloorMinor` |

---

## 3. Tech stack

Use the **latest stable** version of each at the time of scaffolding. Do not pin
to what is listed here if something newer and stable exists; record the chosen
versions in `docs/adr/0001-tech-stack.md`.

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite** + **React** + **TypeScript (strict)** | Fast DX, first-class Vitest integration, trivial static deploy to Firebase Hosting. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Requested. v4 uses CSS-first config and native CSS variables → perfect for theming. |
| Animation | **Motion** (`motion/react`, formerly Framer Motion) | Layout animations, `AnimatePresence`, spring physics, scroll/gesture support. |
| Charts | **Nivo** (`@nivo/line`, `@nivo/bar`, `@nivo/pie`, `@nivo/calendar`) | Requested. Rich built-in animations (react-spring), themeable, responsive wrappers. |
| Routing | **React Router** (library mode, data APIs optional) | Standard; lazy routes for code-splitting. |
| State | **Zustand** (UI state) + repository subscriptions (data state) | Minimal boilerplate; persisted data is owned by the repository layer, not by global stores. |
| Local DB | **Dexie** (IndexedDB) with `liveQuery` | Reactive queries, schema versioning/migrations, large data OK. |
| Validation | **Zod** | Runtime schemas for entities = single source of truth for types, form validation, import/export, and later Firestore converters. |
| Dates | **date-fns** | Tree-shakeable pure functions. Dates are stored as plain `YYYY-MM-DD` strings (see §4.4). |
| Forms | **React Hook Form** + `@hookform/resolvers/zod` | Performance + Zod integration. |
| UI primitives | **Radix UI** primitives (Dialog, Popover, DropdownMenu, Tooltip, Switch, Tabs) | Accessible by default; unstyled so Tailwind owns the look. |
| Toasts | **sonner** | Tiny, animated, accessible. |
| Icons | **lucide-react** | Consistent stroke icons, tree-shakeable. |
| Fonts | **Inter** (UI) with `font-variant-numeric: tabular-nums` for all figures; optional display font for hero numbers | Numbers must not jitter while animating. |
| IDs | `crypto.randomUUID()` | Firestore-compatible, no dependency. |
| Unit/component tests | **Vitest** + **@testing-library/react** + **@testing-library/user-event** + **jsdom** + **fake-indexeddb** | Fast, Vite-native. |
| E2E tests | **Playwright** | Cross-browser, trace viewer, CI-friendly. |
| Lint/format | **ESLint** (flat config, `typescript-eslint`, `react-hooks`, `jsx-a11y`) + **Prettier** (+ `prettier-plugin-tailwindcss`) | Consistency for contributors and agents. |
| Git hooks | **Husky** + **lint-staged** + **commitlint** (Conventional Commits) | Enforce quality before it reaches CI. |
| Secret scanning | **gitleaks** (pre-commit via hook + GitHub Action) | Belt and braces for an open-source repo. |
| CI/CD | **GitHub Actions** | Lint → typecheck → unit → build → e2e; deploy to Firebase Hosting on `main` (Phase 8). |
| Backend (later) | **Firebase**: Auth, Firestore, Hosting, Emulator Suite, App Check | Requested. |
| Package manager | **pnpm** | Fast, strict, lockfile-friendly. (`npm` acceptable if pnpm unavailable — pick one and commit the lockfile.) |

**Deliberately not included (MVP):** Redux, GraphQL, server components/SSR, CSS-in-JS, moment.js, any float-based money library.

---

## 4. Domain model

All entities are defined **once** as Zod schemas in `src/domain/schemas/` and
types are inferred (`type Wallet = z.infer<typeof WalletSchema>`). Every entity
carries `householdId` from day one even though MVP has a single local household.

### 4.1 Entities

```ts
// Common
type ISODate = string;        // 'YYYY-MM-DD' — a calendar date, no time, no timezone
type ISODateTime = string;    // full ISO 8601 with offset, only for audit fields
type Minor = number;          // integer amount in minor units (cents). NEVER a float.
type CurrencyCode = string;   // ISO 4217, e.g. 'USD', 'BRL', 'EUR'

interface Household {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;      // display & calculation currency
  balanceFloorMinor: Minor;        // forecast warning threshold, default 0
  weekStartsOn: 0 | 1;             // 0 = Sunday, 1 = Monday
  memberIds: string[];             // [] until Phase 8
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Wallet {
  id: string;
  householdId: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  currency: CurrencyCode;          // MVP: must equal household.baseCurrency (validated)
  initialBalanceMinor: Minor;      // balance at `initialBalanceDate`
  initialBalanceDate: ISODate;
  color: string;                   // token name from the design system, e.g. 'violet'
  icon: string;                    // lucide icon name
  archived: boolean;
  sortOrder: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Transaction {
  id: string;
  householdId: string;
  walletId: string;
  kind: 'income' | 'expense';
  amountMinor: Minor;              // always positive; `kind` gives the sign
  currency: CurrencyCode;
  date: ISODate;                   // the day the money moves
  description: string;
  notes?: string;
  status: 'pending' | 'cleared';   // pending = scheduled but not yet happened
  recurringRuleId?: string;        // set when posted from a rule
  occurrenceDate?: ISODate;        // the rule date it was posted from (may differ from `date` if user moved it)
  categoryId?: string;             // reserved for Phase 9
  tagIds?: string[];               // reserved for Phase 9
  createdBy?: string;              // memberId, Phase 8
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface RecurringRule {
  id: string;
  householdId: string;
  walletId: string;
  kind: 'income' | 'expense';
  amountMinor: Minor;
  currency: CurrencyCode;
  description: string;
  notes?: string;
  schedule: Schedule;
  autoPost: boolean;               // true: create Transaction automatically when date arrives
  exceptions: RecurrenceException[];
  active: boolean;
  categoryId?: string;             // reserved
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

type Schedule =
  | { frequency: 'daily';   interval: number; startDate: ISODate; end: ScheduleEnd }
  | { frequency: 'weekly';  interval: number; weekdays: Weekday[]; startDate: ISODate; end: ScheduleEnd }   // interval 2 = biweekly
  | { frequency: 'monthly'; interval: number; dayOfMonth: number | 'last'; startDate: ISODate; end: ScheduleEnd }
  | { frequency: 'yearly';  interval: number; month: number; dayOfMonth: number | 'last'; startDate: ISODate; end: ScheduleEnd };

type ScheduleEnd =
  | { type: 'never' }
  | { type: 'onDate'; date: ISODate }
  | { type: 'afterCount'; count: number };

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface RecurrenceException {
  date: ISODate;                   // the original occurrence date
  action: 'skip' | 'override';
  overrideAmountMinor?: Minor;
  overrideDate?: ISODate;          // move this single occurrence
}

// Derived (never persisted)
interface Occurrence {
  ruleId: string;
  date: ISODate;                   // effective date after exceptions
  originalDate: ISODate;
  kind: 'income' | 'expense';
  amountMinor: Minor;
  walletId: string;
  description: string;
  posted: boolean;                 // a Transaction with this ruleId+occurrenceDate exists
  transactionId?: string;
}

interface ForecastPoint {
  date: ISODate;
  balanceMinor: Minor;             // end-of-day projected balance
  deltaMinor: Minor;               // net movement that day
  items: Array<Transaction | Occurrence>;
  belowFloor: boolean;
}
```

### 4.2 Core pure functions (`src/domain/`)

These are the heart of the app. They take plain data and a `today: ISODate`
argument (never read the clock themselves) and return plain data.

| Function | Responsibility | Must-test edge cases |
|---|---|---|
| `expandSchedule(rule, from, to, today)` → `Occurrence[]` | Generate occurrences in a date range, applying exceptions and end conditions. | Day 29/30/31 in short months (clamp to last day), `'last'` day, Feb 29 yearly rules in non-leap years, `interval > 1` alignment to `startDate`, `afterCount` with skips (skipped occurrences still count), range boundaries inclusive, rule starting mid-range, `active: false` returns `[]`. |
| `markPosted(occurrences, transactions)` | Flag occurrences that already have a Transaction. | Match on `recurringRuleId + occurrenceDate`, not on `date`. |
| `computeWalletBalance(wallet, transactions, asOf)` | Initial balance + cleared transactions up to `asOf`. | Transactions before `initialBalanceDate` are ignored; pending transactions excluded; archived wallets still compute. |
| `computeNetWorth(wallets, transactions, asOf)` | Sum of non-archived wallet balances. | Credit wallets contribute negatively when type is `credit`. |
| `buildForecast(input, from, to, today)` → `ForecastPoint[]` | Day-by-day projection: current balance + pending transactions + unposted occurrences. | Floor detection, horizon with zero items, items on the same day, overrides that move dates across the horizon edge. |
| `summarizeMonth(transactions, occurrences, month)` | Income, expenses, net, counts, biggest items, comparison to previous month. | Month boundaries, empty month. |
| `upcoming(items, today, days)` | Next N days of pending transactions and occurrences sorted by date. | Today inclusive, ties sorted by amount desc. |
| `money.*` | `add`, `subtract`, `multiply`, `format(minor, currency, locale)`, `parse(input, currency)`. | Currencies with 0 decimals (JPY) and 3 decimals (KWD); negative formatting; parsing `"1.234,56"` vs `"1,234.56"` based on locale. |
| `dates.*` | `today(tz?)`, `addMonthsClamped`, `lastDayOfMonth`, `isLeapYear`, `eachDayInRange`. | DST transitions must not shift dates (we never use `Date` arithmetic across midnight — convert via date-fns on local calendar values). |

### 4.3 Multi-currency — MVP interpretation

- Each **household** has a `baseCurrency` the user picks from the full ISO 4217
  list during onboarding and can change in Settings.
- In MVP, all wallets, transactions and rules **must** use the household's
  base currency (enforced by Zod refinement). The `currency` field exists on
  every entity so Phase 9 can introduce per-entry currencies + exchange rates
  without a data migration.
- Formatting always uses `Intl.NumberFormat` with the household currency and the
  browser locale; UI language is **en-US** (no i18n framework in MVP, but all
  user-facing strings go through a single `src/shared/i18n/strings.ts` module so
  adding i18n later is mechanical).
- Changing `baseCurrency` in MVP does **not** convert amounts; it shows a
  confirmation dialog explaining that.

### 4.4 Dates & time

- Calendar dates are strings `YYYY-MM-DD`. No `Date` objects cross module
  boundaries. This eliminates timezone and DST bugs for a calendar-based domain.
- "Today" is injected from one place (`useToday()` hook / `getToday()` in
  non-React code) so tests can freeze time and the forecast can be scrubbed.
- Audit fields (`createdAt`, `updatedAt`) are full ISO timestamps.

### 4.5 Money

- Integers in minor units. Never `number` with decimals; never `parseFloat` on
  user input — parse via `money.parse` which handles locale separators.
- Minor unit exponent per currency comes from a small built-in table
  (`src/domain/money/currencies.ts`) — 0, 2 or 3 decimals.

---

## 5. Architecture

### 5.1 Layers

```
┌──────────────────────────────────────────────────────────────┐
│ app/          routes, providers, layout shell, theme         │
├──────────────────────────────────────────────────────────────┤
│ features/     one folder per feature: UI + hooks + feature   │
│               state; may import domain, data, shared         │
├──────────────────────────────────────────────────────────────┤
│ domain/       pure TS: schemas, money, dates, recurrence,    │
│               balances, forecast. Imports NOTHING from above │
├──────────────────────────────────────────────────────────────┤
│ data/         repository interfaces + adapters               │
│               (memory | dexie | firebase). Imports domain.   │
├──────────────────────────────────────────────────────────────┤
│ shared/       design-system components, hooks, utils, i18n   │
└──────────────────────────────────────────────────────────────┘
```

Enforce import direction with `eslint-plugin-boundaries` or
`eslint-plugin-import` `no-restricted-paths`:
`domain` → nothing; `data` → `domain`; `shared` → `domain`;
`features` → `domain | data | shared`; `app` → everything.

### 5.2 Directory layout

```
money-tracker/
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/deploy.yml            (Phase 8)
│   ├── ISSUE_TEMPLATE/ (bug, feature)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── copilot-instructions.md         (agent conventions, mirrors AGENTS.md)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DOMAIN.md                        (glossary + calculations, with examples)
│   ├── TESTING.md
│   ├── DESIGN.md                        (tokens, motion rules, component catalog)
│   ├── SECURITY.md                      (keys, rules, reporting vulnerabilities)
│   ├── DEPLOY.md
│   ├── CONTRIBUTING.md
│   └── adr/                             (0001-tech-stack.md, …)
├── e2e/                                 (Playwright specs + fixtures)
├── public/
├── src/
│   ├── app/
│   │   ├── main.tsx, App.tsx, router.tsx
│   │   ├── providers/ (ThemeProvider, RepositoryProvider, TodayProvider, Toaster)
│   │   └── layout/    (AppShell, Sidebar, TopBar, MobileNav)
│   ├── domain/
│   │   ├── schemas/   (household.ts, wallet.ts, transaction.ts, recurringRule.ts)
│   │   ├── money/     (money.ts, currencies.ts)
│   │   ├── dates/     (dates.ts)
│   │   ├── recurrence/ (expandSchedule.ts, exceptions.ts)
│   │   ├── balances/  (walletBalance.ts, netWorth.ts)
│   │   ├── forecast/  (buildForecast.ts, summarizeMonth.ts, upcoming.ts)
│   │   └── index.ts
│   ├── data/
│   │   ├── repository.ts        (interfaces)
│   │   ├── memory/              (InMemoryRepository — tests & demo)
│   │   ├── dexie/               (db.ts schema+migrations, DexieRepository)
│   │   ├── firebase/            (Phase 8: FirestoreRepository, converters)
│   │   ├── seed/                (demo dataset generator)
│   │   └── index.ts             (createRepository(kind) factory)
│   ├── features/
│   │   ├── onboarding/
│   │   ├── wallets/
│   │   ├── transactions/        (one-time earnings & debts)
│   │   ├── recurring/           (rules, occurrences, exceptions, posting)
│   │   ├── dashboard/
│   │   ├── forecast/
│   │   ├── settings/
│   │   └── households/          (Phase 8)
│   ├── shared/
│   │   ├── ui/                  (Button, Card, Dialog, Input, MoneyInput, DatePicker, Select, Switch, Tabs, EmptyState, Skeleton, AnimatedNumber, …)
│   │   ├── charts/              (Nivo theme + wrappers: LineChart, BarChart, PieChart, CalendarHeatmap)
│   │   ├── motion/              (variants, transitions, useReducedMotion helpers)
│   │   ├── hooks/
│   │   ├── i18n/strings.ts
│   │   └── utils/
│   ├── styles/
│   │   ├── index.css            (Tailwind v4 @theme tokens, dark mode vars)
│   │   └── fonts.css
│   └── test/
│       ├── setup.ts             (jest-dom, fake-indexeddb, matchMedia mock)
│       ├── factories.ts         (builders: makeWallet(), makeTransaction(), …)
│       └── render.tsx           (renderWithProviders)
├── .env.example
├── .gitignore                   (.env.local, .env.*.local, coverage, dist, playwright-report)
├── firebase.json, .firebaserc   (Phase 8)
├── firestore.rules, firestore.indexes.json (Phase 8)
├── AGENTS.md                    (short conventions file for AI agents)
├── README.md
├── LICENSE                      (MIT)
├── CODE_OF_CONDUCT.md
├── package.json, pnpm-lock.yaml, tsconfig*.json, vite.config.ts, vitest.config.ts,
│   playwright.config.ts, eslint.config.js, .prettierrc, commitlint.config.js
```

### 5.3 Repository pattern (`src/data/repository.ts`)

```ts
export interface EntityRepository<T extends { id: string; householdId: string }> {
  list(householdId: string): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(entity: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
  /** Push-based: emits the full list on every change. Returns unsubscribe. */
  subscribe(householdId: string, listener: (items: T[]) => void): () => void;
}

export interface Repository {
  households: EntityRepository<Household>;
  wallets: EntityRepository<Wallet>;
  transactions: EntityRepository<Transaction>;
  recurringRules: EntityRepository<RecurringRule>;
  /** Atomic multi-entity write (posting occurrences, deleting a wallet + its txns). */
  transaction<R>(work: (tx: Repository) => Promise<R>): Promise<R>;
  /** Wipe everything (used by "Reset data" and by tests). */
  clear(): Promise<void>;
}
```

- `InMemoryRepository` — used in unit/component tests and for the "Try the demo" mode.
- `DexieRepository` — production local adapter; `subscribe` is backed by `liveQuery`.
- `FirestoreRepository` — Phase 8; `subscribe` is backed by `onSnapshot`.
- Features consume data through hooks like `useWallets()` that wrap `subscribe`
  (via `useSyncExternalStore`), so swapping adapters changes zero feature code.
- All writes validate with Zod before hitting the adapter.
- Adapter selection: `VITE_DATA_ADAPTER=dexie|memory|firebase` with `dexie` as default.

### 5.4 Auto-posting of occurrences

A `PostingService` runs on app start and whenever `today` changes:
for every active rule with `autoPost: true`, expand occurrences from the rule's
`lastPostedDate` (or `startDate`) through `today`, and create `cleared`
Transactions for any not yet posted, inside one repository transaction.
Rules with `autoPost: false` show occurrences as "due" with a one-click
**Post** button. Idempotent by construction (`recurringRuleId + occurrenceDate`
unique index).

### 5.5 State management

- Persisted data: repository subscriptions → `useSyncExternalStore` hooks. No duplication into Zustand.
- UI state (theme, sidebar collapsed, forecast horizon, selected wallet filter, dialogs): one small Zustand store per feature, persisted to `localStorage` only where it makes sense (theme, horizon).
- Derived data (balances, forecast) computed with `useMemo` from subscriptions; if profiling shows cost, move to a Web Worker — the domain layer is pure so this is trivial.

---

## 6. UX & feature specification

### 6.1 Information architecture / routes

| Route | Screen | Primary content |
|---|---|---|
| `/` | **Dashboard** | Net-worth hero, forecast sparkline, this-month summary, upcoming items, wallets strip, quick-add |
| `/wallets` | Wallets | Cards grid with animated balances; create/edit/archive; per-wallet detail at `/wallets/:id` |
| `/transactions` | Transactions | Filterable, grouped-by-day list of all one-time + posted transactions; inline edit; bulk delete |
| `/recurring` | Recurring | Two tabs: Earnings / Debts. Rule cards with next occurrence, monthly equivalent, timeline of next 6 occurrences; exceptions editor |
| `/forecast` | Plan ahead | Full-width projected balance chart (30/60/90/180 days, custom), day-detail drawer, floor line, "what-if" toggle to include/exclude rules |
| `/settings` | Settings | Household name, base currency, week start, balance floor, theme, data export/import (JSON), reset, about |
| `/welcome` | Onboarding | 3-step: name household → pick currency → create first wallet (or load demo data) |

Mobile: bottom tab bar (Dashboard, Transactions, + quick add, Recurring, Forecast); settings via avatar/menu.

### 6.2 Dashboard

1. **Hero net worth** — large `AnimatedNumber` that counts up on mount and on change; delta chip vs 30 days ago; subtle animated gradient mesh background.
2. **Forecast preview** — Nivo line chart, next 30 days, area gradient, floor line dashed, danger segments tinted red; click → `/forecast`.
3. **This month** — income vs expenses bars (Nivo bar, grouped), net, savings rate ring.
4. **Upcoming (next 14 days)** — list of occurrences & pending transactions with date pills; "Post now" / "Skip" actions; staggered entrance animation.
5. **Wallets strip** — horizontally scrollable wallet cards with balance and 7-day sparkline.
6. **Spending heatmap** — Nivo calendar of expense totals for the last 6 months (collapsed on mobile).
7. **Quick add** — FAB → bottom sheet (mobile) / dialog (desktop) with segmented control Earning/Debt, amount pad, wallet, date, description, "make it recurring" switch that expands schedule fields.

### 6.3 Recurring rules

- Form: kind, description, amount, wallet, frequency (Daily / Weekly / Every 2 weeks / Monthly / Yearly / Custom interval), weekday chips or day-of-month picker (with "Last day" option), start date, end (never / on date / after N), auto-post toggle.
- Live preview panel: "Next 6 occurrences" updates as the form changes (direct use of `expandSchedule`).
- Rule card: description, amount, badge with human-readable schedule ("Monthly on the 5th"), next date, "≈ $X / month" normalized equivalent, mini-timeline.
- Exceptions: from an occurrence row → Skip this one / Change amount for this one / Move this one. Visible as markers in the timeline; revertable.
- Deleting a rule asks: keep or delete already-posted transactions.

### 6.4 Transactions

- Grouped by day with sticky day headers; day subtotal.
- Filters: wallet, kind, status, date range, text search. Filters persist in URL search params.
- Row: icon by kind, description, wallet chip, amount colored (income emerald / expense rose), status dot. Swipe actions on mobile.
- Inline edit sheet; delete with undo toast (optimistic, 5s).

### 6.5 Forecast ("plan ahead")

- Controls: horizon (30/60/90/180/365), wallet scope (all / one), toggles per rule to simulate "what if I cancel this?", toggle pending one-time items.
- Chart: projected balance line with area; floor as dashed line; crossing below floor shaded; tooltip with items of the day; brush/zoom on desktop.
- Below chart: "Key moments" — first day below floor, lowest point and date, highest point, end-of-horizon balance; each animates in.
- Day drawer: clicking a point lists every item on that day with Post/Skip/Edit actions.

### 6.6 Empty, loading and error states

- Every list has a designed empty state with illustration (CSS/SVG, animated) and a primary CTA.
- Skeletons mirror final layout; shimmer respects reduced motion.
- Errors: inline, actionable; never a blank screen (ErrorBoundary per route).

---

## 7. Visual design & motion

Document in `docs/DESIGN.md`; implement tokens in `src/styles/index.css` via Tailwind v4 `@theme`.

### 7.1 Direction

"Premium fintech, calm and confident": deep neutral surfaces, one vivid accent
gradient, generous whitespace, glass-like elevated cards, crisp tabular
numbers. Dark mode is the hero; light mode is equally polished (not an
afterthought).

### 7.2 Tokens

- **Color:** semantic tokens (`--color-bg`, `--color-surface`, `--color-surface-elevated`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-fg`, `--color-income`, `--color-expense`, `--color-warning`, `--color-danger`) defined for `:root` and `.dark`. Wallet colors: a palette of 10 named hues, each with light/dark variants.
- **Radius:** `sm 8px`, `md 12px`, `lg 16px`, `xl 24px`, `full`.
- **Shadow/elevation:** 3 levels + an accent glow for focus/hover on primary elements.
- **Typography:** Inter; scale 12/14/16/20/24/32/48/64; figures always `tabular-nums`.
- **Spacing:** Tailwind default 4px grid.
- **Breakpoints:** Tailwind defaults; layout shifts at `md` (sidebar) and `lg` (two-column dashboard).

### 7.3 Motion rules

- Durations: micro 120–180ms, standard 220–300ms, expressive 400–600ms. Springs for layout, ease-out for entrances.
- Page transitions: `AnimatePresence` fade + 8px rise; shared layout for cards expanding into detail views (`layoutId`).
- Lists: staggered children (30–40ms) on first mount only; `layout` prop for reorder/remove.
- Numbers: `AnimatedNumber` tweens the value and keeps tabular width; color flashes green/red on increase/decrease.
- Charts: Nivo `animate` with `motionConfig="gentle"`; disable when reduced motion.
- `prefers-reduced-motion: reduce` → `MotionConfig reducedMotion="user"` globally; no parallax or auto-playing loops.
- Never block interaction with animation; no animation > 600ms on a critical path.

### 7.4 Accessibility

- All interactive elements keyboard-reachable with visible focus rings.
- Color is never the only signal (icons ± for income/expense).
- Contrast AA minimum in both themes; charts have accessible tables toggle (`sr-only` fallback table).
- Playwright a11y smoke via `@axe-core/playwright` on each route.

---

## 8. Testing policy (mandatory)

Full detail in `docs/TESTING.md`. Summary:

### 8.1 Pyramid & tools

| Level | Tool | Location | What |
|---|---|---|---|
| Unit | Vitest | colocated `*.test.ts` | `domain/*`, `data/*` adapters (with `fake-indexeddb`), utils |
| Component | Vitest + Testing Library + user-event | colocated `*.test.tsx` | Each shared UI component; each feature screen with `InMemoryRepository` |
| Integration | Vitest | `src/features/**/__tests__/*.int.test.tsx` | Flows across features through the real repository factory (`memory`) |
| E2E | Playwright | `e2e/*.spec.ts` | Critical user journeys against the built app with `dexie` adapter, Chromium + WebKit + mobile viewport |
| Visual | Playwright screenshots | `e2e/visual/*.spec.ts` | Dashboard, wallets, forecast in light/dark at 2 viewports (deterministic seed + frozen time) |
| A11y | `@axe-core/playwright` | within e2e | No serious/critical violations per route |

### 8.2 Rules

1. **Every PR that adds or changes behavior includes tests at the appropriate level(s).** PR template has a checkbox; reviewers (human or agent) reject otherwise.
2. **Coverage thresholds** (enforced in `vitest.config.ts`): `src/domain/**` 100% lines/branches; `src/data/**` 90%; overall project 80%. Thresholds may only go up.
3. **Determinism:** tests never use the real clock — inject `today`; `vi.useFakeTimers()` when needed. Seed data is generated from a fixed seed.
4. **Test data via factories** (`src/test/factories.ts`), never hand-written object literals in tests.
5. **Component tests query by role/label**, not by test IDs, except for charts (`data-testid` on chart wrappers; chart internals are not unit-tested — the data fed to them is).
6. **E2E journeys required for MVP:**
   - Onboard → create wallet → add one-time debt → balance updates.
   - Create monthly recurring earning → preview shows 6 dates → dashboard upcoming shows it → post it → transaction appears.
   - Create recurring debt on the 31st → occurrences clamp correctly in Feb/Apr.
   - Forecast shows below-floor warning when a large debt is added.
   - Dark/light toggle persists after reload.
   - Mobile: quick-add via FAB.
   - Export JSON → reset → import JSON → data identical.
7. **CI gates** on every PR: `lint`, `typecheck`, `test:unit --coverage`, `build`, `test:e2e`. Merging to `main` requires all green.
8. **Flaky test policy:** a flaky test is a bug; fix or quarantine with an issue link within 24h — never retry-to-green silently.

### 8.3 Scripts (package.json)

```
dev            vite
build          tsc -b && vite build
preview        vite preview
typecheck      tsc -b --noEmit
lint           eslint . && prettier --check .
lint:fix       eslint . --fix && prettier --write .
test           vitest
test:unit      vitest run --coverage
test:e2e       playwright test
test:e2e:ui    playwright test --ui
test:all       pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build && pnpm test:e2e
emulators      firebase emulators:start          (Phase 8)
test:rules     vitest run --config vitest.rules.config.ts   (Phase 8)
```

---

## 9. Security & secrets

Documented in `docs/SECURITY.md`.

### 9.1 What is actually secret in a Firebase web app

Firebase web config values (`apiKey`, `authDomain`, `projectId`, …) are
**identifiers, not secrets** — they are shipped to every browser. Real
protection comes from:

1. **Firestore Security Rules** — users can only read/write households they are members of. Rules are versioned in `firestore.rules` and **tested** with `@firebase/rules-unit-testing` against the emulator in CI.
2. **Firebase App Check** (reCAPTCHA v3 / Enterprise) — blocks requests from unauthorized origins.
3. **Authorized domains** in Firebase Auth + **HTTP referrer restrictions** on the API key in Google Cloud Console.
4. **No privileged credentials in the client, ever** — service account JSON, admin SDK keys and CI deploy tokens live only in GitHub Secrets.

### 9.2 Repository hygiene (applies from Phase 0)

- All config via `import.meta.env.VITE_*`; a committed `.env.example` lists every variable with a dummy value and a comment.
- `.env.local` and `.env.*.local` are git-ignored; `.gitignore` is committed in Phase 0 **before** any env file exists.
- Startup check: in `firebase` adapter mode, missing env vars throw a clear error; in `dexie` mode none are needed, so forks run with zero setup.
- **gitleaks** runs as a pre-commit hook and as a GitHub Action on every PR.
- GitHub repo settings (documented, not automatable from code): enable secret scanning + push protection, Dependabot alerts + security updates, branch protection on `main`.
- Dependabot config (`.github/dependabot.yml`) for npm + GitHub Actions, weekly.
- `SECURITY.md` includes a responsible-disclosure contact.
- Demo mode uses only generated data; never commit real financial data (seed generator is deterministic & fictional).

### 9.3 Data privacy

- Local mode: all data stays in the browser's IndexedDB. "Export" and "Reset" are always available.
- Cloud mode: data is scoped per household; deleting a household deletes its data (Phase 8, via Cloud Function or client-side batch).

---

## 10. Firebase readiness & deployment (Phase 8 details)

- `firebase.json`: hosting `public: dist`, SPA rewrite to `/index.html`, cache headers for hashed assets, emulators for auth + firestore + hosting.
- `.firebaserc` with project aliases `default` / `staging` — project IDs are not secret, but keep them in env for forks: `VITE_FIREBASE_PROJECT_ID`.
- Local dev against emulators: `VITE_USE_FIREBASE_EMULATORS=true` connects SDKs to `localhost` ports; no real project needed for contributors.
- Auth: Google provider; `AuthProvider` exposes `user`, `signIn`, `signOut`; routes guarded; local mode stays available as "Continue offline".
- Households: on first sign-in create a household; invitation flow by email (pending invites collection); members list in Settings.
- Migration: "Upload my local data" wizard copies Dexie → Firestore once, then switches adapter.
- Firestore layout: `households/{hid}` with subcollections `wallets`, `transactions`, `recurringRules`, `members`; `users/{uid}` with `householdIds`. Composite indexes committed in `firestore.indexes.json`.
- CI deploy (`deploy.yml`): on push to `main` → build with env from secrets → `FirebaseExtended/action-hosting-deploy`; PRs get preview channels.
- Rules tests cover: non-member cannot read; member can read/write; cannot change `householdId`; amounts must be integers; schema shape validation mirrors Zod (keep both in sync via a documented checklist).

---

## 11. Documentation plan

| File | Content | Owner phase |
|---|---|---|
| `README.md` | Pitch + screenshots/GIF, features, quick start (3 commands), tech stack badges, links to docs, license | 0, updated each phase |
| `AGENTS.md` + `.github/copilot-instructions.md` | 1-page conventions for AI agents: layering rules, testing rules, commands, "always inject today", "never floats for money", commit format | 0 |
| `docs/ARCHITECTURE.md` | Layer diagram, data flow, repository pattern, adapter swapping, state strategy | 0, 2 |
| `docs/DOMAIN.md` | Glossary, entity reference, calculation semantics with worked examples (e.g. rule on the 31st, afterCount with skips) | 1 |
| `docs/DESIGN.md` | Tokens, motion rules, component catalog with usage, do/don't | 0, 7 |
| `docs/TESTING.md` | Policy, how to run, how to write each test level, factories, debugging Playwright | 0 |
| `docs/SECURITY.md` | §9 expanded; vulnerability reporting | 0, 8 |
| `docs/DEPLOY.md` | Local serve, build, Firebase Hosting, emulators, env matrix | 0, 8 |
| `docs/CONTRIBUTING.md` | Setup, branch naming, Conventional Commits, PR checklist, code review expectations, definition of done | 0 |
| `docs/adr/NNNN-*.md` | Architecture Decision Records (tech stack, dates as strings, money as integers, repository pattern, Nivo, Dexie, …) | ongoing |
| `CHANGELOG.md` | Keep a Changelog format; generated from Conventional Commits with `changesets` or `release-please` | 0 |
| JSDoc | Every exported function in `domain/` and `data/` has a doc comment with an example | ongoing |

---

## 12. Conventions

- **Language:** TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any` (lint error). Prefer `type` imports.
- **Naming:** `PascalCase` components/types, `camelCase` functions/vars, `SCREAMING_SNAKE` constants, files match default export (`WalletCard.tsx`, `expandSchedule.ts`). Minor-unit fields end in `Minor`.
- **Components:** function components, props interface named `XProps`, no default exports except route components (for lazy loading). Co-locate `X.tsx`, `X.test.tsx`, optionally `X.stories.tsx`.
- **Hooks:** `useX`, return objects not tuples (except trivial toggles).
- **Imports:** path alias `@/` → `src/`. Enforced layer boundaries (§5.1).
- **Commits:** Conventional Commits (`feat(recurring): add monthly clamping`), scopes = feature folder names. Branches `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- **PRs:** small, one concern; description links to the plan section; checklist: tests added, docs updated, screenshots for UI, a11y checked, no secrets.
- **ADRs:** any deviation from this plan or any non-obvious choice gets an ADR (template in `docs/adr/0000-template.md`).
- **Definition of Done (per feature):** code + unit/component tests + e2e if it's a user flow + docs updated + lint/typecheck clean + CI green + reviewed.

---

## 13. Delivery roadmap

Work strictly phase by phase. Each phase ends with `pnpm test:all` green, docs
updated, and a Conventional Commit per logical change. Do not start a phase
until the previous one's Definition of Done is met.

### Phase 0 — Foundation (tooling, design tokens, docs skeleton)
- [x] Scaffold Vite + React + TS (strict); pnpm; path alias.
- [x] Tailwind v4 with `@theme` tokens; dark/light via `.dark` class + system preference; `ThemeProvider` + toggle; fonts.
- [x] ESLint flat config (ts, react-hooks, jsx-a11y, boundaries), Prettier (+ tailwind plugin), Husky, lint-staged, commitlint, gitleaks hook.
- [x] Vitest + Testing Library + jsdom + fake-indexeddb setup; coverage thresholds; `src/test/*` helpers.
- [x] Playwright config (Chromium, WebKit, Pixel 7 viewport), axe integration, smoke test on `/`.
- [x] GitHub Actions `ci.yml` (lint, typecheck, unit+coverage, build, e2e with artifacts), Dependabot, gitleaks action, issue/PR templates.
- [x] App shell: router, `AppShell` with sidebar/topbar/mobile nav, route placeholders, page transition, `ErrorBoundary`, Toaster.
- [x] Shared UI v1: Button, Card, Input, Select, Switch, Dialog/Sheet, Tabs, Tooltip, Skeleton, EmptyState, `AnimatedNumber`.
- [x] Docs: README, AGENTS.md, copilot-instructions, CONTRIBUTING, TESTING, DESIGN, SECURITY, DEPLOY, ARCHITECTURE, ADR template + ADR-0001 tech stack, LICENSE (MIT), CODE_OF_CONDUCT, CHANGELOG, `.env.example`, `.gitignore`.
- **DoD:** `pnpm dev` shows themed shell with working navigation; CI green on a PR; all docs exist (skeletons acceptable where the phase hasn't happened).

### Phase 1 — Domain core (pure logic, 100% coverage)
- [x] Zod schemas + inferred types for all entities; refinements (positive integer amounts, currency match, valid dates, schedule invariants).
- [x] `money` (currency table, add/sub/mul, format, parse) with exhaustive tests.
- [x] `dates` helpers with DST/leap tests.
- [ ] `expandSchedule` + exceptions + end conditions — property-based tests (`fast-check`) in addition to examples.
- [ ] `computeWalletBalance`, `computeNetWorth`, `markPosted`, `buildForecast`, `summarizeMonth`, `upcoming`.
- [ ] `docs/DOMAIN.md` with worked examples; JSDoc on every export.
- **DoD:** `src/domain` at 100% coverage; no React imports; ADRs for dates-as-strings and money-as-integers.

### Phase 2 — Data layer
- [ ] `Repository` interfaces; `InMemoryRepository`; `DexieRepository` (schema v1, indexes incl. unique `[recurringRuleId+occurrenceDate]`), `liveQuery` subscriptions, transactions, `clear`.
- [ ] Factory `createRepository()` driven by `VITE_DATA_ADAPTER`; `RepositoryProvider`; `useRepository()`, `useCollection()` via `useSyncExternalStore`.
- [ ] Contract test suite run against **both** adapters (same spec file, parametrized).
- [ ] Deterministic seed generator (`seed/demo.ts`) for demo mode and visual tests.
- [ ] `PostingService` (auto-post) + `TodayProvider`.
- [ ] JSON export/import (versioned envelope validated by Zod).
- **DoD:** contract tests pass for memory & dexie; ARCHITECTURE.md updated.

### Phase 3 — Onboarding & Wallets
- [ ] `/welcome` flow (household name → currency picker with search → first wallet or demo data).
- [ ] Wallets grid, create/edit/archive sheet, color/icon picker, wallet detail with transactions and 30-day sparkline.
- [ ] Component tests for every screen; e2e: onboarding journey.
- **DoD:** user can onboard and manage wallets with animated balances.

### Phase 4 — One-time transactions (earnings & debts)
- [ ] Quick-add dialog/sheet (`MoneyInput` with locale parsing, date picker, wallet select, kind segmented control).
- [ ] `/transactions` list: day grouping, filters in URL, inline edit, delete with undo, pending vs cleared.
- [ ] Balances update live across the app.
- [ ] Tests: component + e2e (add debt → balance decreases).
- **DoD:** full CRUD with animations and empty states.

### Phase 5 — Recurring rules
- [ ] Rule form with live "next 6 occurrences" preview; schedule builder UI for all frequencies, `'last'` day, end conditions, auto-post.
- [ ] `/recurring` tabs, rule cards (human-readable schedule string, monthly equivalent), timeline.
- [ ] Occurrence actions: post now, skip, override amount, move date; exception markers; revert.
- [ ] Delete rule dialog (keep/delete posted transactions).
- [ ] Auto-posting on app start / day change with toast summary ("3 items posted").
- [ ] Tests: component tests for form & cards; e2e for the monthly rule journey and the 31st-clamping journey.
- **DoD:** recurring earnings and debts fully manageable; auto-posting idempotent.

### Phase 6 — Dashboard & Forecast
- [ ] Nivo theme bound to design tokens (reads CSS variables; re-renders on theme change); chart wrappers with responsive containers, accessible fallback tables, reduced-motion handling.
- [ ] Dashboard widgets (§6.2) with staggered entrance; widgets individually tested with seeded data.
- [ ] `/forecast` screen (§6.5): horizon controls, what-if toggles, floor line, key moments, day drawer.
- [ ] Tests: component tests assert the *data* passed to charts (mock chart components), e2e for below-floor warning; visual snapshots for dashboard & forecast in both themes.
- **DoD:** dashboard and forecast complete and beautiful on desktop + mobile.

### Phase 7 — Polish & hardening
- [ ] Motion pass: shared-layout transitions, number flashes, list reorders, skeletons; reduced-motion audit.
- [ ] Responsive pass on all screens at 360/768/1024/1440; touch targets ≥ 44px.
- [ ] A11y pass: axe clean on every route; keyboard-only walkthrough documented.
- [ ] Performance: route-level code splitting, Nivo imports per-chart, Lighthouse ≥ 90 perf/a11y/best-practices; bundle size budget in CI (`size-limit`).
- [ ] Settings: currency change warning, floor, week start, export/import/reset.
- [ ] README screenshots/GIF; CHANGELOG `v0.1.0`; tag release.
- **DoD:** MVP release `v0.1.0`.

### Phase 8 — Firebase
- [ ] `firebase.json`, `.firebaserc`, emulator config, `DEPLOY.md` complete; `pnpm emulators`.
- [ ] Firebase SDK init from `VITE_FIREBASE_*`; emulator switch; startup validation of env.
- [ ] `FirestoreRepository` passing the adapter contract tests against the emulator.
- [ ] Auth (Google), `AuthProvider`, guarded routes, "Continue offline".
- [ ] Households & members, invites; local → cloud migration wizard.
- [ ] `firestore.rules` + `firestore.indexes.json`; rules tests in CI via emulator.
- [ ] App Check setup documented; `deploy.yml` with preview channels; secrets documented in SECURITY.md.
- **DoD:** app deployed to Firebase Hosting from CI; a second user can join a household and see shared data; rules tests green.

### Phase 9+ — Future features (each its own mini-plan/ADR)
Categories & tags → Budgets → Goals & savings targets → Per-entry currencies & FX → Import/Export formats → PWA/offline sync → Reminders.

---

## 14. Decisions already made (do not relitigate without an ADR)

1. Dates are `YYYY-MM-DD` strings; "today" is injected.
2. Money is integer minor units + ISO currency code; never floats.
3. Single household in MVP but `householdId` on every entity.
4. Only the household base currency is allowed on entities in MVP; field exists for later.
5. Recurring occurrences are derived, not stored; posting creates Transactions; idempotency via `recurringRuleId + occurrenceDate`.
6. Repository pattern with `subscribe`; features never import Dexie or Firebase directly.
7. Nivo for charts, Motion for animation, Tailwind v4 for styling, Radix for primitives.
8. Tests are mandatory per PR; domain coverage 100%.
9. UI language en-US; strings centralized for future i18n.
10. Firebase web config lives in env vars and is treated as config; security is enforced by Rules + App Check + key restrictions.

## 15. Open questions (answer before the relevant phase)

- Should a `credit` wallet's balance be shown as debt (negative) or as "available credit"? Default: negative balance = amount owed. (Phase 3)
- Default forecast horizon on the dashboard preview: 30 days? (Phase 6)
- Should auto-posted transactions be `cleared` immediately or `pending` until the user confirms? Default: `cleared` when `autoPost` is on. (Phase 5)
- License: MIT assumed. (Phase 0)
- Project display name / logo. (Phase 0 placeholder: "Money Tracker")

---

## 16. How an AI coding agent should use this plan

1. Read this file and `AGENTS.md` (once created) at the start of every session.
2. Work on exactly one phase checklist item (or a tight group) at a time; keep diffs reviewable.
3. For each item: write/extend tests first or alongside; run `pnpm test:all` (or the smallest relevant subset while iterating, then the full set before finishing); update docs; commit with a Conventional Commit message referencing the phase (e.g. `feat(domain): expandSchedule monthly clamping [P1]`).
4. Never read the system clock in domain code; never use floats for money; never import `dexie`/`firebase` outside `src/data/`.
5. If something in this plan is impossible or clearly wrong, stop, write an ADR proposing the change, and ask the maintainer before proceeding.
6. Update the checkboxes in §13 as items are completed.
