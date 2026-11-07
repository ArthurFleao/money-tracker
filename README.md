# Money Tracker

> See what you have, what is coming, and where you are headed.

A local-first personal & household finance tracker: wallets, recurring and
one-time earnings and debts, and a day-by-day forecast that warns you before
your balance dips below your floor. Runs 100 % in the browser — no account,
no server, no setup.

> **Status:** Phase 0 (foundation) — themed app shell, design system v1,
> tooling, CI and docs. Features land phase by phase; see the roadmap in
> [PLAN.md §13](./PLAN.md#13-delivery-roadmap).

## Features (planned MVP)

- **Wallets** — cash, checking, savings, credit… with live, animated balances.
- **Recurring earnings & debts** — salary on the 5th, rent monthly, subscriptions yearly.
- **One-time transactions** — ad-hoc earnings and debts.
- **Dashboard** — net worth, this month, upcoming items, charts.
- **Plan ahead** — projected balance per day with danger zones.
- Dark + light themes, desktop and mobile layouts, keyboard and screen-reader friendly.

## Quick start

Requires **Node 24** (see [`.nvmrc`](./.nvmrc)) and **pnpm 12**
(`npm i -g pnpm` or `corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test:all     # typecheck, lint, unit + coverage, build, e2e
```

First e2e run: `pnpm exec playwright install chromium webkit`.

## Scripts

| Command                       | What it does                                         |
| ----------------------------- | ---------------------------------------------------- |
| `pnpm dev`                    | Vite dev server                                      |
| `pnpm build` / `pnpm preview` | Production build / serve it locally                  |
| `pnpm typecheck`              | `tsc -b` in strict mode                              |
| `pnpm lint` / `pnpm lint:fix` | ESLint (incl. layer boundaries + a11y) and Prettier  |
| `pnpm test`                   | Vitest in watch mode                                 |
| `pnpm test:unit`              | Vitest once, with coverage thresholds                |
| `pnpm test:e2e`               | Playwright (Chromium, WebKit, Pixel 7) + axe         |
| `pnpm test:all`               | Everything above — must be green before every commit |

## Tech stack

React 19 · TypeScript 6 (strict) · Vite 8 · Tailwind CSS 4 · Motion · Radix UI ·
React Router 8 · Zustand · Vitest 5 + Testing Library · Playwright + axe ·
ESLint 9 · Prettier · Husky + commitlint + gitleaks. Coming in later phases:
Zod, Dexie (IndexedDB), date-fns, React Hook Form, Nivo charts, Firebase.
Exact versions and the reasoning live in
[ADR-0001](./docs/adr/0001-tech-stack.md).

## Documentation

- [PLAN.md](./PLAN.md) — scope, domain model, architecture, roadmap (source of truth)
- [AGENTS.md](./AGENTS.md) — non-negotiable rules for contributors and AI agents
- [Architecture](./docs/ARCHITECTURE.md) · [Domain](./docs/DOMAIN.md) ·
  [Design system](./docs/DESIGN.md) · [Testing](./docs/TESTING.md)
- [Contributing](./docs/CONTRIBUTING.md) · [Security](./docs/SECURITY.md) ·
  [Deploy](./docs/DEPLOY.md) · [Decisions (ADRs)](./docs/adr/)
- [Changelog](./CHANGELOG.md) · [Code of Conduct](./CODE_OF_CONDUCT.md)

## Privacy

In local mode every byte stays in your browser (IndexedDB). There is no
analytics and no server. Never commit real financial data — demo data is
generated.

## License

[MIT](./LICENSE)
