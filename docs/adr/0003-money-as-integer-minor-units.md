# 0003 — Represent money as integer minor units

- **Status:** Accepted
- **Date:** 2026-11-07
- **Deciders:** maintainer, implementing agent
- **Phase:** P1
- **Related:** PLAN.md §4.1, §4.5, §14 decision 2; AGENTS.md rule 2

## Context

Binary floating point cannot represent most decimal fractions (`0.1 + 0.2 !==
0.3`). In a finance app those errors accumulate across balances, forecasts and
monthly summaries, and they surface as off-by-one-cent totals that users notice
immediately. User input is also locale-dependent: `1.234,56` (pt-BR, de-DE) and
`1,234.56` (en-US) are the same amount, and `parseFloat` gets one of them
wrong silently.

## Decision

1. Every amount is an **integer number of minor units** (`Minor`, e.g. cents)
   plus an ISO 4217 `currency` code. Field names end in `Minor`
   (`amountMinor`, `initialBalanceMinor`, `balanceFloorMinor`). Schemas reject
   non-integers and unsafe integers (`Number.isSafeInteger`).
2. The number of minor digits comes from a built-in table
   (`src/domain/money/currencies.ts`): every active ISO 4217 currency with an
   exponent of 0 (JPY, KRW, …), 2 (most) or 3 (KWD, BHD, …). Funds, metals and
   test codes are excluded. We do not rely on CLDR's digits, which differ from
   ISO 4217 for some currencies (CLDR uses 0 digits for IQD, IDR and HUF).
3. All arithmetic goes through `money.add/subtract/multiply/sum`. They throw
   `RangeError` on non-integers or overflow; `multiply` rounds half away from
   zero (used for normalised equivalents such as "≈ per month").
4. **Formatting** (`money.format`) builds an exact decimal string from the
   integer and hands it to `Intl.NumberFormat` (which accepts decimal strings),
   with the fraction digits forced to the currency's exponent. No float is
   created, so values up to `Number.MAX_SAFE_INTEGER` format exactly.
5. **Parsing** (`money.parse`) never uses floats. It reads the group and
   decimal separators, minus sign and native digits for the locale from
   `Intl`, strips the currency symbol/code (local and English forms) and bidi
   marks, and accepts grouping separators only in valid positions (Western
   3-digit or Indian 2/3-digit groups). Ambiguous input is rejected with a
   reason (`empty`, `invalid`, `tooPrecise`, `outOfRange`) rather than guessed
   — `"1.5"` in pt-BR is `invalid`, not 15.
6. Lint forbids `parseFloat`/`Number.parseFloat` anywhere in `src/`.

## Alternatives considered

| Option                           | Pros                            | Cons                                                   |
| -------------------------------- | ------------------------------- | ------------------------------------------------------ |
| Floats with rounding on display  | trivial                         | errors accumulate; equality checks unreliable          |
| `bigint` minor units             | unlimited range                 | not JSON-serialisable, awkward with Zod/IndexedDB/Nivo |
| Decimal library (big.js, dinero) | rich API                        | extra dependency; still needs locale parsing           |
| **Integer minor units (number)** | exact up to ±9×10¹⁵, JSON-ready | must guard against floats (schemas + lint + tests)     |

## Consequences

- ±90 trillion dollars (2-decimal) is the representable range — ample for a
  household app; overflow throws instead of corrupting data.
- `parse(format(x)) === x` is a property test across 12 locales (including
  Arabic/Persian digits, French narrow no-break spaces, Swiss apostrophes and
  Indian grouping) and 0/2/3-decimal currencies.
- Phase 9 multi-currency adds exchange rates on top of this representation; no
  data migration is needed because every entity already stores `currency`.
