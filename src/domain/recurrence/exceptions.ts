import type { ISODate } from '../dates/dates';
import type { RecurrenceException } from '../schemas/recurringRule';
import type { Occurrence } from './occurrence';

/**
 * Applies the exception (if any) for an occurrence's original date: a skip
 * removes it (`undefined`), an override changes its amount and/or date.
 *
 * @example
 * applyException(occurrence, skipException(occurrence.originalDate)); // undefined
 * applyException(occurrence, overrideException(occurrence.originalDate, { overrideAmountMinor: 1 }));
 * // { ...occurrence, amountMinor: 1 }
 */
export function applyException(
  occurrence: Occurrence,
  exception: RecurrenceException | undefined,
): Occurrence | undefined {
  if (!exception) return occurrence;
  if (exception.action === 'skip') return undefined;
  return {
    ...occurrence,
    date: exception.overrideDate ?? occurrence.date,
    amountMinor: exception.overrideAmountMinor ?? occurrence.amountMinor,
  };
}

/**
 * Adds an exception, replacing any existing one for the same date. Returns a
 * new array sorted by date.
 *
 * @example
 * upsertException(rule.exceptions, skipException('2026-03-01'));
 */
export function upsertException(
  exceptions: readonly RecurrenceException[],
  exception: RecurrenceException,
): RecurrenceException[] {
  return [...removeException(exceptions, exception.date), exception].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/**
 * Removes the exception for `date` — reverting that occurrence to the rule.
 *
 * @example
 * removeException(rule.exceptions, '2026-03-01');
 */
export function removeException(
  exceptions: readonly RecurrenceException[],
  date: ISODate,
): RecurrenceException[] {
  return exceptions.filter((exception) => exception.date !== date);
}
