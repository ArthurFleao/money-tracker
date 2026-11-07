# Domain

The domain layer (`src/domain/`) is pure TypeScript: no React, no storage, no
clock. Every function takes plain data (and `today` when it matters) and
returns plain data. It is the single place where money, dates, schedules,
balances and forecasts are calculated, and it is covered at 100 % by unit and
property-based tests. Source of truth for scope: [PLAN.md §2 and
§4](../PLAN.md#4-domain-model).

```ts
import { money, expandSchedule, buildForecast, type Wallet } from '@/domain';
```

## Glossary

Use these exact words in code, UI and docs: **Household · Member · Wallet ·
Transaction** (`kind: 'income' | 'expense'`) **· Earning** (UI for income)
**· Debt** (UI for expense) **· Recurring rule · Occurrence** (derived, never
persisted) **· Posting · Exception · Forecast · Floor**. Definitions:
[PLAN.md §2](../PLAN.md#2-glossary-use-these-words-everywhere-code-ui-docs).

## Invariants

| Rule                                                                                                        | Enforced by                                                                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Money is an integer in minor units + ISO 4217 code — [ADR-0003](./adr/0003-money-as-integer-minor-units.md) | Zod (`z.int()`), `money.*` throws on floats, lint bans `parseFloat`                 |
| Calendar dates are `YYYY-MM-DD` strings — [ADR-0002](./adr/0002-dates-as-strings.md)                        | `ISODateSchema` (real dates only), `dates.*`                                        |
| Domain code never reads the clock                                                                           | lint bans `Date.now()`, `new Date()`, `Date()`, `performance.now()` in `src/domain` |
| Domain imports no UI/state/storage library                                                                  | lint (`no-restricted-imports`, layer boundaries)                                    |
| Every entity carries `householdId`                                                                          | Zod schemas                                                                         |
| MVP: every entity uses the household base currency                                                          | `requireCurrency(schema, baseCurrency)`                                             |

## Modules

| Module           | Exports                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dates/dates.ts` | `ISODate`, `ISOMonth`, `Weekday`, `isValidISODate`, `addDays`, `addMonthsClamped`, `diffInDays`, `eachDayInRange`, `weekdayOf`, `makeDate`, `lastDayOfMonth`, `daysInMonth`, `isLeapYear`, `today`, `monthOf`, `monthRange`, … |
| `money/`         | `money.add/subtract/multiply/sum/format/parse/toDecimalString`, `CURRENCIES`, `currencyExponent`, `isCurrencyCode`                                                                                                             |
| `schemas/`       | `HouseholdSchema`, `WalletSchema`, `TransactionSchema`, `RecurringRuleSchema`, `ScheduleSchema`, `RecurrenceExceptionSchema`, `requireCurrency`, inferred types                                                                |
| `recurrence/`    | `Occurrence`, `LedgerItem`, `expandSchedule`, `scheduleDates`, `markPosted`, `applyException`, `upsertException`, `removeException`, `isOccurrence`, `signedAmount`                                                            |
| `balances/`      | `computeWalletBalance`, `computeNetWorth`, `affectsWallet`                                                                                                                                                                     |
| `forecast/`      | `buildForecast`, `ForecastPoint`, `summarizeMonth`, `upcoming`                                                                                                                                                                 |

## Entities

Defined once as Zod schemas in `src/domain/schemas/`; types are inferred
(`type Wallet = z.infer<typeof WalletSchema>`). Validate on every write.

| Entity                | Notable rules                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Household`           | `baseCurrency` from the ISO 4217 table; `balanceFloorMinor` any integer; `weekStartsOn` `0 \| 1`; name trimmed, 1–120 chars.                                                               |
| `Wallet`              | `initialBalanceMinor` any integer (negative = owed, e.g. `credit`); `initialBalanceDate` a real date; `color` one of the 10 palette names (`WALLET_COLORS`).                               |
| `Transaction`         | `amountMinor` a **positive** integer — `kind` gives the sign; `status` `pending \| cleared`; `recurringRuleId` and `occurrenceDate` are both set or both absent.                           |
| `RecurringRule`       | positive `amountMinor`; a valid `schedule`; at most one exception per date.                                                                                                                |
| `Schedule`            | `interval ≥ 1`; weekly `weekdays` non-empty and unique; `dayOfMonth` 1–31 or `'last'`; yearly day must exist in that month (Feb 29 allowed); `onDate` end ≥ `startDate`; `afterCount ≥ 1`. |
| `RecurrenceException` | `skip` has no overrides; `override` changes `overrideAmountMinor` (positive) and/or `overrideDate`.                                                                                        |

Audit fields (`createdAt`, `updatedAt`) are ISO 8601 timestamps with an
offset. Schema messages are developer-facing; forms map issues to strings in
`src/shared/i18n/strings.ts`.

## Money

Amounts are integers in the currency's minor unit; the exponent comes from the
built-in ISO 4217 table (`JPY` 0, `USD` 2, `KWD` 3).

| Call                                                           | Result                                               |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| `money.add(1050, 250)`                                         | `1300`                                               |
| `money.multiply(1000, 52 / 12)`                                | `4333` (half away from zero)                         |
| `money.add(0.1, 0.2)`                                          | throws `RangeError` — not minor units                |
| `money.format(123456, 'USD', 'en-US')`                         | `$1,234.56`                                          |
| `money.format(-123456, 'BRL', 'pt-BR')`                        | `-R$ 1.234,56`                                       |
| `money.format(1234567, 'KWD', 'en-US')`                        | `KWD 1,234.567`                                      |
| `money.format(500, 'USD', 'en-US', { signDisplay: 'always' })` | `+$5.00`                                             |
| `money.parse('1,234.56', 'USD', 'en-US')`                      | `{ ok: true, amountMinor: 123456 }`                  |
| `money.parse('1.234,56', 'BRL', 'pt-BR')`                      | `{ ok: true, amountMinor: 123456 }`                  |
| `money.parse('1.234,56', 'USD', 'en-US')`                      | `{ ok: false, error: 'invalid' }`                    |
| `money.parse('1.5', 'BRL', 'pt-BR')`                           | `{ ok: false, error: 'invalid' }` — never read as 15 |
| `money.parse('1.5', 'JPY', 'ja-JP')`                           | `{ ok: false, error: 'tooPrecise' }`                 |
| `money.parse('12,34,567.89', 'INR', 'en-IN')`                  | `{ ok: true, amountMinor: 123456789 }`               |

`parse` uses the separators of the locale's **currency** format (the same
ones `format` emits), accepts an optional sign, the currency symbol or code
(local or English form), native digits (Arabic, Persian, …) and grouping
separators only in valid positions. `parse(format(x)) === x` is a property
test across 15 locales plus a 43-locale sweep.

## Dates

All helpers work on `YYYY-MM-DD` strings and are timezone-independent (UTC
epoch-day arithmetic — see [ADR-0002](./adr/0002-dates-as-strings.md)).

| Call                                                 | Result                           |
| ---------------------------------------------------- | -------------------------------- |
| `addDays('2026-12-31', 1)`                           | `'2027-01-01'`                   |
| `addMonthsClamped('2026-01-31', 1)`                  | `'2026-02-28'`                   |
| `addMonthsClamped('2024-02-29', 12)`                 | `'2025-02-28'`                   |
| `makeDate(2024, 2, 'last')`                          | `'2024-02-29'`                   |
| `eachDayInRange('2024-02-27', '2024-03-01')`         | 4 days, including `'2024-02-29'` |
| `weekdayOf('2026-11-07')`                            | `6` (Saturday)                   |
| `today(Date.UTC(2026, 0, 1, 2), 'America/New_York')` | `'2025-12-31'`                   |

`today(nowMs, timeZone?)` converts an instant **supplied by the caller** into
a calendar date — the app layer passes `Date.now()` (Phase 2 `TodayProvider`).

## Recurrence

`expandSchedule(rule, from, to)` returns the rule's occurrences whose
**effective** date lies in `[from, to]` (both inclusive), sorted by date.

Semantics:

- **Alignment.** `interval` counts from `startDate`: every _n_-th day, every
  _n_-th 7-day window starting on `startDate` (weekly — independent of the
  household's `weekStartsOn`), every _n_-th month or year counted from the
  start month/year. Dates before `startDate` are never produced.
- **Short months.** Days 29–31 clamp to the last day of shorter months;
  `'last'` is always the last day; a yearly Feb 29 rule falls on Feb 28 in
  common years.
- **End.** `onDate` is inclusive. `afterCount` counts _original_ dates, so
  skipped occurrences still count.
- **Exceptions** are keyed by the original date. `skip` removes the
  occurrence; `override` changes its amount and/or moves it. A moved
  occurrence keeps its `originalDate` (its identity) and appears wherever its
  new date falls — even if the original was outside the range. Exceptions for
  dates the schedule does not produce are ignored.
- **Inactive** rules (`active: false`) and inverted ranges produce nothing.
- `posted` is `false`; `markPosted(occurrences, transactions)` flags those that
  have a Transaction with the same `recurringRuleId` **and** `occurrenceDate`
  equal to the original date (never matched on `date`, which may have moved).

The plan's signature listed a `today` argument; expansion does not depend on
it, so the function does not take one.

### Worked examples

| Rule                                              | Range               | Occurrences                                                            |
| ------------------------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| Monthly on the 31st from 2026-01-01               | Jan–Jun 2026        | Jan 31, **Feb 28**, Mar 31, **Apr 30**, May 31, **Jun 30**             |
| Monthly on `'last'` from 2024-01-01               | Jan–Apr 2024        | Jan 31, **Feb 29**, Mar 31, Apr 30                                     |
| Yearly on Feb 29 from 2024-02-29                  | 2024–2028           | 2024-02-29, **2025-02-28**, **2026-02-28**, **2027-02-28**, 2028-02-29 |
| Every 3 months on the 10th, start 2026-01-15      | 2026                | Apr 10, Jul 10, Oct 10 (Jan 10 is before the start)                    |
| Every 2 weeks on Friday from Fri 2026-01-02       | Jan 1 – Feb 15 2026 | Jan 2, Jan 16, Jan 30, Feb 13                                          |
| Every 2 weeks Mon/Wed/Fri from **Wed** 2026-01-07 | Jan 2026            | Jan 7, 9, 12 · (window skipped) · Jan 21, 23, 26                       |
| Monthly on the 5th, after 3, Feb 5 skipped        | 2026                | Jan 5, Mar 5 — the skip used up one of the 3                           |
| Monthly on the 1st, Feb 1 moved to Mar 15         | Jan–Mar 2026        | Jan 1, Mar 1, Mar 15 (`originalDate` 2026-02-01)                       |

Daily and weekly rules skip ahead to the requested window (unless they end
`afterCount`, which must count from the start), so a rule that began decades
ago expands in well under a millisecond per year of range.

## Balances

- `computeWalletBalance(wallet, transactions, asOf)` — balance at the **end**
  of `asOf`: `initialBalanceMinor` plus every **cleared** transaction of the
  wallet dated from `initialBalanceDate` through `asOf`. The initial balance
  holds from the _start_ of `initialBalanceDate`, so transactions on that day
  count; earlier ones are ignored. Before `initialBalanceDate` the balance is
  the initial balance (we have no earlier history). Archived wallets compute
  normally.
- `computeNetWorth(wallets, transactions, asOf)` — sum of the balances of
  **non-archived** wallets. A `credit` wallet that is owed money has a
  negative balance and therefore lowers net worth (PLAN.md §15 default).

Example: a wallet opened with $100.00 on 2026-01-10, a $10.00 expense on
2026-01-10 and a $99.99 expense on 2026-01-09 → `computeWalletBalance(…,
'2026-01-31')` is `9000` ($90.00).

## Forecast

`buildForecast(input, from, to, today)` returns one `ForecastPoint` per day in
`[from, to]` for the scoped wallets (`input.walletIds`, default: every
non-archived wallet). It opens with the cleared balance at the end of the day
before `min(from, today)`, then adds per day:

1. **cleared** transactions (any day — history);
2. **pending** transactions dated `today` or later (unless `includePending: false`);
3. **unposted occurrences** of active rules dated `today` or later, except
   rules listed in `excludedRuleIds` ("what if I cancel this?"). Posted
   occurrences are counted through their Transaction, never twice.

Overdue items (pending or unposted before `today`) are not projected.
`belowFloor` is `balanceMinor < balanceFloorMinor`. A window that starts in the
future opens with everything projected between today and its start.

### Worked example

Today is **2026-11-07**, the floor is **$100.00**. Checking opened with
$1,500.00 on 2026-11-01; groceries of $200.00 cleared on 2026-11-03; a dentist
bill of $150.00 is pending on 2026-11-08; Rent ($1,200.00) is a monthly rule on
the 10th.

| Date       | Items             | Delta     | Balance  | Below floor |
| ---------- | ----------------- | --------- | -------- | ----------- |
| (opening)  | $1,500 − $200     |           | 1,300.00 |             |
| 2026-11-07 |                   | 0.00      | 1,300.00 | no          |
| 2026-11-08 | Dentist (pending) | −150.00   | 1,150.00 | no          |
| 2026-11-09 |                   | 0.00      | 1,150.00 | no          |
| 2026-11-10 | Rent (occurrence) | −1,200.00 | −50.00   | **yes**     |
| 2026-11-11 |                   | 0.00      | −50.00   | **yes**     |

This exact scenario is asserted in `buildForecast.test.ts`.

## Month summary and upcoming

- `summarizeMonth(transactions, occurrences, month, { top = 3 })` totals every
  transaction dated in the month (cleared **and** pending) plus its
  **unposted** occurrences: income, expenses, net, counts, the biggest incomes
  and expenses (ties: earlier date, then description), the previous month's
  totals and the change. Pass occurrences already run through `markPosted`
  and covering the previous month too.
- `upcoming(items, today, days)` lists **pending** transactions and
  **unposted** occurrences dated in `[today, today + days − 1]`, soonest first;
  on the same day the biggest amount comes first.

Example: in February a $5,000 salary (cleared), a $500 bonus (pending), $300 of
groceries and an unposted $1,500 rent occurrence give income $5,500, expenses
$1,800 and net $3,700. With $1,000 of expenses in January, the change in net
is +$4,700.
