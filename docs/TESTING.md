# Testing

> Policy summary from [PLAN.md §8](../PLAN.md#8-testing-policy-mandatory).
> **Every change that adds or alters behavior ships with tests.**

## Running tests

| Command                         | Use it for                                                                 |
| ------------------------------- | -------------------------------------------------------------------------- |
| `pnpm test`                     | Vitest watch mode while developing                                         |
| `pnpm vitest run src/shared/ui` | One folder / file, fast iteration                                          |
| `pnpm test:unit`                | All unit + component tests with coverage thresholds                        |
| `pnpm test:e2e`                 | Playwright against the production build                                    |
| `pnpm test:e2e:ui`              | Playwright UI mode for debugging                                           |
| `pnpm test:all`                 | Everything (typecheck, lint, unit, build, e2e) — required before finishing |

First-time e2e setup: `pnpm exec playwright install chromium webkit`
(CI uses `--with-deps`).

## Levels

| Level       | Tool                                  | Location                                   | What                                                             |
| ----------- | ------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Unit        | Vitest                                | colocated `*.test.ts`                      | `domain`, `data` adapters, utils, hooks                          |
| Component   | Vitest + Testing Library + user-event | colocated `*.test.tsx`                     | every shared UI component and screen                             |
| Integration | Vitest                                | `src/features/**/__tests__/*.int.test.tsx` | flows across features via the real repository factory (`memory`) |
| E2E         | Playwright                            | `e2e/*.spec.ts`                            | user journeys on Chromium, WebKit and Pixel 7                    |
| Visual      | Playwright screenshots                | `e2e/visual/*.spec.ts`                     | from Phase 6                                                     |
| A11y        | `@axe-core/playwright`                | inside e2e                                 | no serious/critical violations per route                         |

## Coverage thresholds

Enforced in `vitest.config.ts`; they may only go up.

- `src/domain/**` — 100 % lines, branches, functions, statements
- `src/data/**` — 90 %
- project — 80 %

## Writing unit and component tests

- Render through **`renderWithProviders(ui)`** from `@/test/render` — it wraps
  the real `AppProviders` and returns `{ user, ...renderResult }` with a
  configured `userEvent`.
- **Query by role and label** (`getByRole('button', { name: 'Save' })`).
  `data-testid` is only allowed on chart wrappers.
- **Test data comes from `@/test/factories`**: `makeHousehold()`,
  `makeWallet()`, `makeTransaction()`, `makeRecurringRule()`,
  `makeOccurrence()`, schedule builders (`dailySchedule()`, `weeklySchedule()`,
  `monthlySchedule()`, `yearlySchedule()`) and exception builders
  (`skipException()`, `overrideException()`). Every factory returns a
  schema-valid entity in the test household and `USD`; pass overrides for what
  the test is about. Generic helpers: `defineFactory`, `createSequence`.
  Never inline entity literals.
- **Never use the real clock.** Inject `today`; use `vi.useFakeTimers()` when
  a component schedules work.
- Components that need a route: build a `createMemoryRouter(routes, { initialEntries })`
  and render `<RouterProvider router={router} />`.

### Domain tests (`src/domain`)

- **TDD and 100 % coverage.** Write examples for every edge case listed in
  PLAN.md §4.2 next to the code (`X.test.ts`).
- **Property-based tests** with [fast-check](https://fast-check.dev/) for
  anything with a large input space. Prefer an _independent oracle_ over
  restating the implementation: `dates` is checked against `Date.UTC`,
  `expandSchedule` against a day-by-day predicate, `money.parse` by
  round-tripping `money.format` across 15 locales (plus a 43-locale sweep). Shared arbitraries
  (`isoDateArb()`, `isoMonthArb()`) live in `@/test/arbitraries`; use
  `fc.gen()` to draw values that depend on earlier ones (e.g. exceptions on
  generated dates).
- **Timezones.** Domain results must not depend on `process.env.TZ`. To check,
  `vi.stubEnv('TZ', 'Pacific/Apia')` inside the test (restored automatically)
  — see the sweep at the end of `dates.test.ts`.
- `src/domain` has no `node` types; use `vi.stubEnv` rather than `process.env`.

### What `src/test/setup.ts` gives every test

- `@testing-library/jest-dom` matchers and automatic cleanup.
- `fake-indexeddb` (IndexedDB in jsdom).
- A controllable `matchMedia` mock reinstalled before each test:
  `installMatchMediaMock().setMatches('(prefers-color-scheme: dark)', true)`.
- A `ResizeObserver` stub (Radix popper primitives).
- `MotionGlobalConfig.skipAnimations = true` so Motion animations finish
  instantly (turn it off inside a test to exercise tweening).
- **Zustand stores reset to their initial state after each test**
  (`src/test/zustandMock.ts`, installed with `vi.mock('zustand')`). To test
  persisted rehydration, write to `localStorage` then call
  `await store.persist.rehydrate()`.
- `localStorage` and the `<html>` class list are cleared after each test;
  mocks, stubbed globals and stubbed env vars are restored automatically.

## Writing e2e tests

- Specs live in `e2e/`, helpers in `e2e/fixtures/`.
- Call `expectNoA11yViolations(page)` (from `e2e/fixtures/axe.ts`) on every
  new route or significant UI state, in both themes where relevant.
- Use `test.skip(({ isMobile }) => …)` for layout-specific journeys
  (sidebar vs. bottom tab bar).
- Playwright's WebKit follows Safari defaults: <kbd>Tab</kbd> does not focus
  links. Assert tab order in Chromium; in WebKit focus programmatically.
- The `webServer` builds and serves the app on port 4173 (`vite build && vite preview`).
- Failures keep a trace, screenshot and video in `test-results/`; open with
  `pnpm exec playwright show-trace <path>/trace.zip`. CI uploads
  `playwright-report/` and `test-results/` as artifacts.

## Flaky tests

A flaky test is a bug. Fix it or quarantine it with an issue link within 24 h.
Retries are disabled on purpose — never retry-to-green.
