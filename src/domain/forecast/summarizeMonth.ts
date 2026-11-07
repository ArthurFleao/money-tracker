import { addMonthsToMonth, isInRange, type ISOMonth, monthRange } from '../dates/dates';
import { type Minor, subtract, sum } from '../money/money';
import { type LedgerItem, type Occurrence } from '../recurrence/occurrence';
import type { Transaction } from '../schemas/transaction';

/** Income/expense totals for one month. */
export interface MonthTotals {
  incomeMinor: Minor;
  expenseMinor: Minor;
  /** `incomeMinor - expenseMinor`. */
  netMinor: Minor;
  incomeCount: number;
  expenseCount: number;
}

/** A month's totals, biggest items and comparison with the previous month. */
export interface MonthSummary extends MonthTotals {
  month: ISOMonth;
  /** Largest incomes, biggest first. */
  topIncome: LedgerItem[];
  /** Largest expenses, biggest first. */
  topExpenses: LedgerItem[];
  previous: MonthTotals;
  /** This month minus the previous month. */
  change: Pick<MonthTotals, 'incomeMinor' | 'expenseMinor' | 'netMinor'>;
}

/**
 * Orders ledger items biggest first, then by date and description, so ties are
 * deterministic.
 */
function biggestFirst(a: LedgerItem, b: LedgerItem): number {
  return (
    b.amountMinor - a.amountMinor ||
    a.date.localeCompare(b.date) ||
    a.description.localeCompare(b.description)
  );
}

function itemsInMonth(
  transactions: readonly Transaction[],
  occurrences: readonly Occurrence[],
  month: ISOMonth,
): LedgerItem[] {
  const range = monthRange(month);
  return [...transactions, ...occurrences.filter((o) => !o.posted)].filter((item) =>
    isInRange(item.date, range),
  );
}

function totals(items: readonly LedgerItem[]): MonthTotals {
  const income = items.filter((item) => item.kind === 'income');
  const expenses = items.filter((item) => item.kind === 'expense');
  const incomeMinor = sum(income.map((item) => item.amountMinor));
  const expenseMinor = sum(expenses.map((item) => item.amountMinor));
  return {
    incomeMinor,
    expenseMinor,
    netMinor: subtract(incomeMinor, expenseMinor),
    incomeCount: income.length,
    expenseCount: expenses.length,
  };
}

/**
 * Summarises a month: every transaction dated in it (cleared and pending)
 * plus its **unposted** occurrences (posted ones are counted through their
 * Transaction — run `markPosted` first). Pass occurrences covering the
 * previous month too, for the comparison.
 *
 * @example
 * const occurrences = markPosted(rules.flatMap((r) => expandSchedule(r, '2026-10-01', '2026-11-30')), transactions);
 * summarizeMonth(transactions, occurrences, '2026-11').netMinor;
 */
export function summarizeMonth(
  transactions: readonly Transaction[],
  occurrences: readonly Occurrence[],
  month: ISOMonth,
  options: { top?: number } = {},
): MonthSummary {
  const { top = 3 } = options;
  const items = itemsInMonth(transactions, occurrences, month);
  const current = totals(items);
  const previous = totals(itemsInMonth(transactions, occurrences, addMonthsToMonth(month, -1)));
  const ranked = [...items].sort(biggestFirst);
  return {
    month,
    ...current,
    topIncome: ranked.filter((item) => item.kind === 'income').slice(0, top),
    topExpenses: ranked.filter((item) => item.kind === 'expense').slice(0, top),
    previous,
    change: {
      incomeMinor: subtract(current.incomeMinor, previous.incomeMinor),
      expenseMinor: subtract(current.expenseMinor, previous.expenseMinor),
      netMinor: subtract(current.netMinor, previous.netMinor),
    },
  };
}
