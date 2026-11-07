import {
  addDays,
  compareDates,
  type DateRange,
  diffInDays,
  type ISODate,
  isInRange,
  makeDate,
  weekdayOf,
} from '../dates/dates';
import type { RecurringRule, Schedule } from '../schemas/recurringRule';
import { applyException } from './exceptions';
import type { Occurrence } from './occurrence';

const MAX_YEAR = 9999;

/** Dates past year 9999 have five-digit years and are outside the supported range. */
function isSupported(date: ISODate): boolean {
  return date.length === 10;
}

/**
 * The schedule's dates from `startDate` on, ignoring the end condition.
 * Daily and weekly schedules jump ahead to the period containing `notBefore`
 * (a hint: earlier dates may still be produced, later ones never skipped).
 */
function* rawDates(schedule: Schedule, notBefore: ISODate): Generator<ISODate> {
  const { startDate, interval } = schedule;
  const startYear = Number(startDate.slice(0, 4));
  const startMonth = Number(startDate.slice(5, 7));
  const skipAhead = (period: number): number =>
    Math.max(0, Math.floor(diffInDays(notBefore, startDate) / period)) * period;

  switch (schedule.frequency) {
    case 'daily':
      for (
        let date = addDays(startDate, skipAhead(interval));
        isSupported(date);
        date = addDays(date, interval)
      ) {
        yield date;
      }
      return;
    case 'weekly':
      // Weeks are 7-day windows counted from startDate; every `interval`-th window is active.
      for (
        let window = addDays(startDate, skipAhead(7 * interval));
        isSupported(window);
        window = addDays(window, 7 * interval)
      ) {
        for (let offset = 0; offset < 7; offset += 1) {
          const date = addDays(window, offset);
          if (isSupported(date) && schedule.weekdays.includes(weekdayOf(date))) yield date;
        }
      }
      return;
    case 'monthly':
      for (
        let index = startYear * 12 + startMonth - 1;
        index < (MAX_YEAR + 1) * 12;
        index += interval
      ) {
        const date = makeDate(Math.floor(index / 12), (index % 12) + 1, schedule.dayOfMonth);
        if (date >= startDate) yield date;
      }
      return;
    case 'yearly':
      for (let year = startYear; year <= MAX_YEAR; year += interval) {
        const date = makeDate(year, schedule.month, schedule.dayOfMonth);
        if (date >= startDate) yield date;
      }
  }
}

/**
 * The schedule's original dates in order, honouring its end condition.
 * `afterCount` counts original dates, so skipped occurrences still count.
 * Pass `notBefore` to let daily/weekly schedules skip ahead; dates before it
 * may still be yielded (callers filter), but none at or after it are missed.
 *
 * @example
 * [...scheduleDates(monthlySchedule({ dayOfMonth: 31, end: { type: 'afterCount', count: 3 } }))];
 * // ['2026-01-31', '2026-02-28', '2026-03-31']
 */
export function* scheduleDates(
  schedule: Schedule,
  notBefore: ISODate = schedule.startDate,
): Generator<ISODate> {
  const { end } = schedule;
  // Counting needs every date from the start, so afterCount never skips ahead.
  const hint = end.type === 'afterCount' ? schedule.startDate : notBefore;
  let count = 0;
  for (const date of rawDates(schedule, hint)) {
    if (end.type === 'onDate' && date > end.date) return;
    if (end.type === 'afterCount' && count === end.count) return;
    count += 1;
    yield date;
  }
}

function byDateThenOriginal(a: Occurrence, b: Occurrence): number {
  return compareDates(a.date, b.date) || compareDates(a.originalDate, b.originalDate);
}

/**
 * Occurrences of a rule whose **effective** date lies in `[from, to]` (both
 * inclusive), after applying exceptions and the end condition, sorted by date.
 * Day 29–31 clamps to the end of short months; `'last'` is always the last
 * day; Feb 29 yearly rules fall on Feb 28 in common years. An occurrence moved
 * into the range by an exception is included even if its original date is
 * outside it (and vice versa). Inactive rules have no occurrences. `posted`
 * is `false` — use `markPosted` to match Transactions.
 *
 * @example
 * expandSchedule(makeRecurringRule({ schedule: monthlySchedule({ dayOfMonth: 31 }) }), '2026-01-01', '2026-04-30')
 *   .map((o) => o.date);
 * // ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']
 */
export function expandSchedule(rule: RecurringRule, from: ISODate, to: ISODate): Occurrence[] {
  if (!rule.active || from > to) return [];

  const range: DateRange = { from, to };
  const exceptions = new Map(rule.exceptions.map((exception) => [exception.date, exception]));
  // Look outside the range far enough to catch occurrences moved into it.
  const moved = rule.exceptions.filter((e) => e.overrideDate !== undefined).map((e) => e.date);
  const earliest = moved.reduce((min, date) => (date < min ? date : min), from);
  const limit = moved.reduce((max, date) => (date > max ? date : max), to);

  const occurrences: Occurrence[] = [];
  for (const originalDate of scheduleDates(rule.schedule, earliest)) {
    if (originalDate > limit) break;
    const occurrence = applyException(
      {
        ruleId: rule.id,
        date: originalDate,
        originalDate,
        kind: rule.kind,
        amountMinor: rule.amountMinor,
        walletId: rule.walletId,
        description: rule.description,
        posted: false,
      },
      exceptions.get(originalDate),
    );
    if (occurrence && isInRange(occurrence.date, range)) occurrences.push(occurrence);
  }
  return occurrences.sort(byDateThenOriginal);
}
