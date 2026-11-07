# 0002 — Store calendar dates as `YYYY-MM-DD` strings

- **Status:** Accepted
- **Date:** 2026-11-07
- **Deciders:** maintainer, implementing agent
- **Phase:** P1
- **Related:** PLAN.md §4.2 (`dates.*`), §4.4, §14 decision 1; AGENTS.md rules 3–4

## Context

The app is calendar-based: a salary lands "on the 5th", rent is due "on the
last day of the month", a forecast has one point per day. None of these values
have a time of day or a timezone. JavaScript `Date` is an _instant_; turning it
into a calendar day depends on the runtime's timezone, so the same `Date` can
be two different days for two household members, and DST transitions can
shift values that are stored as midnight.

PLAN.md §4.2 suggested doing date arithmetic with date-fns "on local calendar
values". While implementing `src/domain/dates`, a timezone-sweep test showed
that local-time arithmetic is still not timezone-safe: in `Pacific/Apia` the
whole day 2011-12-30 does not exist, so `new Date(2011, 11, 30)` becomes
2011-12-31 and any local-time `addDays` skips a calendar day. Midnight DST
gaps (e.g. `America/Sao_Paulo` on 2018-11-04) produce a similar shift in
the time of day.

## Decision

1. Calendar dates are `ISODate` strings in `YYYY-MM-DD` form (and months are
   `ISOMonth` strings in `YYYY-MM` form). No `Date` object crosses a module
   boundary. Lexicographic order equals chronological order, so dates compare
   with `<`/`>` and sort with `compareDates`.
2. `src/domain/dates` performs all arithmetic on **UTC epoch days**
   (`Date.UTC` + `getUTC*`), and month arithmetic on plain year/month integers
   with clamping. The runtime timezone can never shift a result. A `Date` is
   used only as a private calculator inside that module.
3. Domain code never reads the clock. `today(nowMs, timeZone?)` converts an
   instant _supplied by the caller_ into a calendar date with
   `Intl.DateTimeFormat`; the app layer supplies `Date.now()` (Phase 2:
   `TodayProvider` / `getToday()`). Lint forbids `Date.now()`, `new Date()`,
   `Date()` and `performance.now()` in `src/domain`.
4. Audit fields (`createdAt`, `updatedAt`) remain full ISO-8601 timestamps with
   an offset — they are instants, not calendar dates.
5. date-fns is **not** used by the domain. It stays in the planned stack for
   UI formatting if `Intl` is not enough, and will be added when first needed.

## Alternatives considered

| Option                                 | Pros                            | Cons                                                        |
| -------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `Date` objects everywhere              | native, familiar                | timezone-dependent days, DST bugs, mutable, poor JSON shape |
| date-fns on local-time `Date`s         | well-known helpers              | still skips/shifts days in some zones (Apia 2011, DST gaps) |
| `@date-fns/utc` / Temporal polyfill    | expressive API                  | extra dependency for ~10 small functions                    |
| **Strings + UTC epoch-day arithmetic** | timezone-free, tiny, JSON-ready | we own ~10 helpers (covered at 100% with property tests)    |

## Consequences

- Every date in schemas is validated as a real calendar date
  (`isValidISODate`), so `2026-02-30` is rejected at the boundary.
- Tests can freeze "today" by passing a string; no fake timers are needed for
  domain code.
- `dates.test.ts` sweeps several timezones (DST gaps, a 30-minute DST shift,
  and Samoa's skipped day) to prove results do not depend on `process.env.TZ`.
- When `Temporal.PlainDate` is broadly available we can reimplement the
  helpers on top of it without changing the string representation.
