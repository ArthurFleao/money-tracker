import { addDays, eachDayInRange, type ISODate } from '../dates/dates';
import { add, type Minor, sum } from '../money/money';
import { affectsWallet, computeWalletBalance } from '../balances/walletBalance';
import { expandSchedule } from '../recurrence/expandSchedule';
import { markPosted } from '../recurrence/markPosted';
import { type LedgerItem, signedAmount } from '../recurrence/occurrence';
import type { RecurringRule } from '../schemas/recurringRule';
import type { Transaction } from '../schemas/transaction';
import type { Wallet } from '../schemas/wallet';

/** Everything `buildForecast` needs. */
export interface ForecastInput {
  wallets: readonly Wallet[];
  transactions: readonly Transaction[];
  rules: readonly RecurringRule[];
  /** Warning threshold (`Household.balanceFloorMinor`). */
  balanceFloorMinor: Minor;
  /** Restrict to these wallets. Default: every non-archived wallet. */
  walletIds?: readonly string[];
  /** "What if I cancel this?" — leave these rules' unposted occurrences out. */
  excludedRuleIds?: readonly string[];
  /** Include pending one-time transactions. Default `true`. */
  includePending?: boolean;
}

/** Projected end-of-day balance for one date (PLAN.md §4.1). */
export interface ForecastPoint {
  date: ISODate;
  /** End-of-day projected balance. */
  balanceMinor: Minor;
  /** Net movement that day. */
  deltaMinor: Minor;
  items: LedgerItem[];
  /** `balanceMinor < balanceFloorMinor`. */
  belowFloor: boolean;
}

/**
 * Day-by-day balance projection for `[from, to]` (both inclusive) over the
 * scoped wallets. It starts from the actual (cleared) balance at the end of
 * the day before `min(from, today)` and then adds, per day:
 *
 * - **cleared** transactions (on any day);
 * - **pending** transactions dated `today` or later (if `includePending`);
 * - **unposted occurrences** of active, non-excluded rules dated `today` or
 *   later. Posted occurrences are already counted through their Transaction.
 *
 * So a window that starts in the future opens with everything projected
 * between today and `from`. Items dated before a wallet's
 * `initialBalanceDate` are ignored, as in `computeWalletBalance`. Overdue
 * items (pending/unposted before `today`) are not projected. Returns `[]`
 * when `from > to`.
 *
 * @example
 * buildForecast(
 *   { wallets: [wallet], transactions, rules, balanceFloorMinor: 0 },
 *   '2026-11-07',
 *   '2026-12-06',
 *   '2026-11-07',
 * ); // 30 ForecastPoints
 */
export function buildForecast(
  input: ForecastInput,
  from: ISODate,
  to: ISODate,
  today: ISODate,
): ForecastPoint[] {
  const { transactions, balanceFloorMinor, walletIds, includePending = true } = input;
  const wallets = walletIds
    ? input.wallets.filter((wallet) => walletIds.includes(wallet.id))
    : input.wallets.filter((wallet) => !wallet.archived);
  const walletsById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const inScope = (item: { walletId: string; date: ISODate }): boolean => {
    const wallet = walletsById.get(item.walletId);
    return wallet !== undefined && affectsWallet(wallet, item);
  };

  // Project from today even when the requested window starts later, so items
  // between today and `from` are part of the opening balance.
  const start = from < today ? from : today;
  const occurrences = input.rules
    .filter((rule) => !input.excludedRuleIds?.includes(rule.id))
    .flatMap((rule) =>
      markPosted(expandSchedule(rule, today, to), transactions).filter((o) => !o.posted),
    );
  const projectedTransactions = transactions.filter(
    (t) => t.status === 'cleared' || (includePending && t.date >= today),
  );

  const itemsByDate = new Map<ISODate, LedgerItem[]>();
  for (const item of [...projectedTransactions, ...occurrences]) {
    if (item.date < start || item.date > to || !inScope(item)) continue;
    itemsByDate.set(item.date, [...(itemsByDate.get(item.date) ?? []), item]);
  }

  let balanceMinor = sum(
    wallets.map((wallet) => computeWalletBalance(wallet, transactions, addDays(start, -1))),
  );
  return eachDayInRange(start, to)
    .map((date) => {
      const items = itemsByDate.get(date) ?? [];
      const deltaMinor = sum(items.map(signedAmount));
      balanceMinor = add(balanceMinor, deltaMinor);
      return {
        date,
        balanceMinor,
        deltaMinor,
        items,
        belowFloor: balanceMinor < balanceFloorMinor,
      };
    })
    .filter((point) => point.date >= from);
}
