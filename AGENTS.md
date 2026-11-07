# AGENTS.md — Working agreement for AI coding agents

Read this file and [PLAN.md](./PLAN.md) at the start of **every** session.
PLAN.md is the source of truth for scope, architecture and the phase roadmap.
This file is the short list of rules you must never break while implementing it.

## 1. Where we are

- Check the checkboxes in **PLAN.md §13** to find the current phase.
- Work on one checklist item (or a tight group) at a time. Finish it — code,
  tests, docs, green `pnpm test:all` — before starting the next.
- Do not start a phase before the previous phase's Definition of Done is met.
- Tick the checkbox in PLAN.md §13 when an item is complete.

## 2. Hard rules (non-negotiable)

1. **No PR / commit that changes behavior without tests.** Unit for logic,
   component for UI, e2e for user flows. See `docs/TESTING.md`.
2. **Money is integer minor units** (`amountMinor: number`, cents). Never floats,
   never `parseFloat` on user input — use `money.parse()` / `money.format()`.
3. **Dates are `YYYY-MM-DD` strings.** No `Date` objects cross module boundaries.
4. **Never read the clock in domain code.** `today` is always a parameter
   (React: `useToday()`; elsewhere: injected). Tests freeze time.
5. **Layer boundaries** (lint-enforced):
   `domain` imports nothing from the app · `data` → `domain` · `shared` → `domain` ·
   `features` → `domain | data | shared` · `app` → anything.
   **Never import `dexie` or `firebase` outside `src/data/`.**
6. **Every entity carries `householdId`.** Even in single-household MVP.
7. **Secrets never touch git.** Config only via `import.meta.env.VITE_*`;
   `.env.local` is git-ignored; update `.env.example` when adding a variable.
8. **Respect `prefers-reduced-motion`** in every animation; no animation
   blocks interaction or exceeds 600 ms on a critical path.
9. **Accessibility is required:** keyboard reachable, visible focus, color is
   never the only signal, axe clean per route.
10. **UI strings are en-US and live in `src/shared/i18n/strings.ts`.**
11. **No `any`.** TypeScript strict with `noUncheckedIndexedAccess` and
    `exactOptionalPropertyTypes`.
12. **Deviation from PLAN.md requires an ADR** in `docs/adr/` and maintainer
    approval before implementation. Do not silently diverge.

## 3. Workflow for each task

```
1. Read the relevant PLAN.md section (and docs/DOMAIN.md for domain work).
2. Write or extend tests alongside the code (TDD preferred for src/domain).
3. Iterate with the smallest relevant command (e.g. `pnpm vitest run src/domain/recurrence`).
4. Before finishing: `pnpm test:all` must be green.
5. Update docs touched by the change (README, docs/*, JSDoc, CHANGELOG).
6. Commit with a Conventional Commit, scope = feature folder, phase tag at end:
   feat(recurring): clamp monthly rules to last day of month [P5]
7. Tick the checkbox in PLAN.md §13.
```

## 4. Commands

Prerequisites: Node 24 (`.nvmrc`) and pnpm 12 (`packageManager`). First e2e
run: `pnpm exec playwright install chromium webkit`.

| Purpose | Command |
|---|---|
| Dev server | `pnpm dev` |
| Typecheck | `pnpm typecheck` |
| Lint + format check | `pnpm lint` (fix: `pnpm lint:fix`) |
| Unit/component tests (watch) | `pnpm test` |
| Unit/component tests + coverage | `pnpm test:unit` |
| E2E | `pnpm test:e2e` (UI: `pnpm test:e2e:ui`) |
| Everything (required before finishing) | `pnpm test:all` |
| Build | `pnpm build` · preview: `pnpm preview` |
| Firebase emulators (Phase 8+) | `pnpm emulators` · rules tests: `pnpm test:rules` |

## 5. Code conventions

- `PascalCase` components/types · `camelCase` functions/vars · `SCREAMING_SNAKE` constants.
- File name = main export: `WalletCard.tsx`, `expandSchedule.ts`. Tests colocated: `X.test.ts(x)`.
- Function components; props type named `XProps`; named exports (default only for lazy route components).
- Hooks `useX` return objects, not tuples.
- Path alias `@/` → `src/`.
- Zod schema is the single source of truth: `type Wallet = z.infer<typeof WalletSchema>`. Validate on every write.
- Fields in minor units end in `Minor`. ISO 4217 codes for `currency`.
- Test data comes from `src/test/factories.ts` builders, never inline literals.
- Component tests query by role/label; `data-testid` only on chart wrappers.
- Every exported function in `src/domain` and `src/data` has JSDoc with an example.
- Keep PRs/commits small and single-purpose. Include screenshots for UI changes.

## 6. Coverage thresholds (enforced, may only increase)

- `src/domain/**` — 100 % lines and branches
- `src/data/**` — 90 %
- project — 80 %

## 7. Glossary (use these exact words)

Household · Member · Wallet · Transaction (`kind: 'income' | 'expense'`) ·
Earning (UI for income) · Debt (UI for expense) · Recurring rule · Occurrence
(derived, never persisted) · Posting · Exception · Forecast · Floor.
Full definitions: PLAN.md §2.

## 8. When unsure

Stop and ask the maintainer (or write an ADR proposing a decision) rather than
guessing. Check PLAN.md §14 (decisions made) and §15 (open questions) first.
