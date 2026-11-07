import type { Transaction } from '../schemas/transaction';
import type { Occurrence } from './occurrence';

function postingKey(ruleId: string, occurrenceDate: string): string {
  return `${ruleId}|${occurrenceDate}`;
}

/**
 * Flags occurrences that already have a Transaction. Matches on
 * `recurringRuleId + occurrenceDate` against the occurrence's **original**
 * date — not on `date`, which the user may have moved.
 *
 * @example
 * markPosted(expandSchedule(rule, from, to), transactions)
 *   .filter((o) => !o.posted); // still due
 */
export function markPosted(
  occurrences: readonly Occurrence[],
  transactions: readonly Transaction[],
): Occurrence[] {
  const posted = new Map<string, string>();
  for (const { id, recurringRuleId, occurrenceDate } of transactions) {
    if (recurringRuleId !== undefined && occurrenceDate !== undefined) {
      posted.set(postingKey(recurringRuleId, occurrenceDate), id);
    }
  }
  return occurrences.map((occurrence) => {
    const { transactionId: _previous, ...rest } = occurrence;
    const transactionId = posted.get(postingKey(occurrence.ruleId, occurrence.originalDate));
    return transactionId === undefined
      ? { ...rest, posted: false }
      : { ...rest, posted: true, transactionId };
  });
}
