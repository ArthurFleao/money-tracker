import { addDays, type ISODate } from '../dates/dates';
import { isOccurrence, type LedgerItem } from '../recurrence/occurrence';

/** Earliest first; on the same day biggest amount first, then by description. */
function soonestFirst(a: LedgerItem, b: LedgerItem): number {
  return (
    a.date.localeCompare(b.date) ||
    b.amountMinor - a.amountMinor ||
    a.description.localeCompare(b.description)
  );
}

/**
 * What is still to come in the next `days` days, `today` included
 * (`[today, today + days - 1]`): **pending** transactions and **unposted**
 * occurrences, soonest first; ties on a day are sorted by amount, biggest
 * first. Cleared transactions and posted occurrences are left out.
 *
 * @example
 * upcoming([...transactions, ...markPosted(occurrences, transactions)], '2026-11-07', 14);
 */
export function upcoming(items: readonly LedgerItem[], today: ISODate, days: number): LedgerItem[] {
  const last = addDays(today, days - 1);
  return items
    .filter((item) => (isOccurrence(item) ? !item.posted : item.status === 'pending'))
    .filter((item) => item.date >= today && item.date <= last)
    .sort(soonestFirst);
}
