import type { ISODate } from '../dates/dates';
import type { Minor } from '../money/money';
import type { Kind } from '../schemas/common';
import type { Transaction } from '../schemas/transaction';

/**
 * One projected instance of a recurring rule on a specific date. Derived from
 * the rule, never persisted (PLAN.md §2, §4.1).
 */
export interface Occurrence {
  ruleId: string;
  /** Effective date, after an exception moved it. */
  date: ISODate;
  /** The date the schedule produced; identifies the occurrence. */
  originalDate: ISODate;
  kind: Kind;
  amountMinor: Minor;
  walletId: string;
  description: string;
  /** A Transaction with this `recurringRuleId` + `occurrenceDate` exists. */
  posted: boolean;
  transactionId?: string;
}

/** Anything that moves money on a date: a real Transaction or a projected Occurrence. */
export type LedgerItem = Transaction | Occurrence;

/**
 * Narrows a ledger item to an Occurrence.
 *
 * @example
 * items.filter(isOccurrence).map((o) => o.ruleId);
 */
export function isOccurrence(item: LedgerItem): item is Occurrence {
  return 'ruleId' in item;
}

/**
 * Signed amount of a ledger item: positive for income, negative for expenses.
 *
 * @example
 * signedAmount(makeTransaction({ kind: 'expense', amountMinor: 500 })); // -500
 */
export function signedAmount(item: Pick<LedgerItem, 'kind' | 'amountMinor'>): Minor {
  return item.kind === 'income' ? item.amountMinor : -item.amountMinor;
}
