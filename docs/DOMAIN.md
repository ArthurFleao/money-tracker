# Domain

> **Skeleton — completed in Phase 1.** The domain model and its rules are
> specified in [PLAN.md §2 and §4](../PLAN.md#2-glossary-use-these-words-everywhere-code-ui-docs).
> This document will hold the entity reference and calculation semantics with
> worked examples once `src/domain/` is implemented.

## Glossary

Use these exact words in code, UI and docs: **Household · Member · Wallet ·
Transaction** (`kind: 'income' | 'expense'`) **· Earning** (UI for income)
**· Debt** (UI for expense) **· Recurring rule · Occurrence** (derived, never
persisted) **· Posting · Exception · Forecast · Floor**. Definitions:
[PLAN.md §2](../PLAN.md#2-glossary-use-these-words-everywhere-code-ui-docs).

## Invariants (already binding)

- Money is an **integer amount in minor units** plus an ISO 4217 currency code.
  Never floats; parse user input with `money.parse()`.
- Calendar dates are **`YYYY-MM-DD` strings**; no `Date` objects cross module
  boundaries.
- Domain code **never reads the clock** — `today` is always a parameter.
- Every entity carries **`householdId`**.

## To be written in Phase 1

- Entity reference (Zod schemas and refinements).
- `money` — currency table, arithmetic, formatting and locale-aware parsing.
- `dates` — helpers, DST and leap-year behavior.
- Recurrence — `expandSchedule`, exceptions, end conditions, with worked
  examples (rule on the 31st, `'last'` day, Feb 29 yearly, `afterCount` with
  skips).
- Balances, net worth, forecast, month summary and upcoming items.
