/** A calendar date, `YYYY-MM-DD`. No time, no timezone (PLAN.md §4.4). */
export type ISODate = string;

/** A calendar month, `YYYY-MM`. */
export type ISOMonth = string;

/** Day of the week, `0` = Sunday … `6` = Saturday (same as `Date#getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** An inclusive range of calendar dates. */
export interface DateRange {
  from: ISODate;
  to: ISODate;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const MS_PER_DAY = 86_400_000;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function matchParts(pattern: RegExp, value: string): DateParts | undefined {
  const match = pattern.exec(value);
  if (!match) return undefined;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3] ?? 1) };
}

function isValidParts({ year, month, day }: DateParts): boolean {
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

function toParts(date: ISODate): DateParts {
  const parts = matchParts(ISO_DATE_PATTERN, date);
  if (!parts || !isValidParts(parts)) {
    throw new RangeError(`Invalid ISO date: "${date}"`);
  }
  return parts;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

function fromParts({ year, month, day }: DateParts): ISODate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/*
 * Day arithmetic runs on "epoch days" computed in UTC, so the runtime's
 * timezone can never shift a date — not even in zones that skipped a whole
 * calendar day (Pacific/Apia, 2011-12-30). See docs/adr/0002.
 */
function toEpochDay(date: ISODate): number {
  const { year, month, day } = toParts(date);
  const utc = new Date(0);
  utc.setUTCFullYear(year, month - 1, day);
  return utc.getTime() / MS_PER_DAY;
}

function fromEpochDay(epochDay: number): ISODate {
  const utc = new Date(epochDay * MS_PER_DAY);
  return fromParts({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  });
}

/**
 * Whether `value` is a real calendar date in `YYYY-MM-DD` form.
 *
 * @example
 * isValidISODate('2024-02-29'); // true
 * isValidISODate('2023-02-29'); // false
 */
export function isValidISODate(value: string): boolean {
  const parts = matchParts(ISO_DATE_PATTERN, value);
  return parts !== undefined && isValidParts(parts);
}

/**
 * Whether `value` is a calendar month in `YYYY-MM` form.
 *
 * @example
 * isValidISOMonth('2026-11'); // true
 * isValidISOMonth('2026-13'); // false
 */
export function isValidISOMonth(value: string): boolean {
  const parts = matchParts(ISO_MONTH_PATTERN, value);
  return parts !== undefined && isValidParts(parts);
}

/**
 * Gregorian leap year test.
 *
 * @example
 * isLeapYear(2024); // true
 * isLeapYear(1900); // false
 * isLeapYear(2000); // true
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Number of days in a month (`month` is 1-based).
 *
 * @example
 * daysInMonth(2024, 2); // 29
 * daysInMonth(2026, 4); // 30
 */
export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  const days = DAYS_IN_MONTH[month - 1];
  if (days === undefined) throw new RangeError(`Invalid month: ${month}`);
  return days;
}

/**
 * Builds a date, clamping `day` into the month. `'last'` means the last day of
 * the month. This is how recurring rules land on short months.
 *
 * @example
 * makeDate(2026, 2, 31); // '2026-02-28'
 * makeDate(2024, 2, 'last'); // '2024-02-29'
 */
export function makeDate(year: number, month: number, day: number | 'last'): ISODate {
  const length = daysInMonth(year, month);
  const clamped = day === 'last' ? length : Math.min(Math.max(day, 1), length);
  return fromParts({ year, month, day: clamped });
}

/**
 * The last day of the month `date` falls in.
 *
 * @example
 * lastDayOfMonth('2026-02-10'); // '2026-02-28'
 */
export function lastDayOfMonth(date: ISODate): ISODate {
  const { year, month } = toParts(date);
  return makeDate(year, month, 'last');
}

/**
 * Adds (or subtracts) whole calendar days. Never shifted by DST or timezone.
 *
 * @example
 * addDays('2026-12-31', 1); // '2027-01-01'
 * addDays('2026-03-01', -1); // '2026-02-28'
 */
export function addDays(date: ISODate, amount: number): ISODate {
  return fromEpochDay(toEpochDay(date) + amount);
}

/**
 * Adds calendar months, clamping to the last day of the target month.
 *
 * @example
 * addMonthsClamped('2026-01-31', 1); // '2026-02-28'
 * addMonthsClamped('2024-02-29', 12); // '2025-02-28'
 */
export function addMonthsClamped(date: ISODate, amount: number): ISODate {
  const { year, month, day } = toParts(date);
  const monthIndex = year * 12 + (month - 1) + amount;
  return makeDate(Math.floor(monthIndex / 12), (monthIndex % 12) + 1, day);
}

/**
 * Whole calendar days from `earlier` to `later` (negative if `later` is before).
 *
 * @example
 * diffInDays('2026-03-01', '2026-02-01'); // 28
 */
export function diffInDays(later: ISODate, earlier: ISODate): number {
  return toEpochDay(later) - toEpochDay(earlier);
}

/**
 * Every date from `from` to `to`, both inclusive. Empty when `from > to`.
 *
 * @example
 * eachDayInRange('2026-02-27', '2026-03-01'); // ['2026-02-27', '2026-02-28', '2026-03-01']
 */
export function eachDayInRange(from: ISODate, to: ISODate): ISODate[] {
  const start = toEpochDay(from);
  const length = toEpochDay(to) - start + 1;
  return Array.from({ length: Math.max(length, 0) }, (_, offset) => fromEpochDay(start + offset));
}

/**
 * Day of the week, `0` = Sunday.
 *
 * @example
 * weekdayOf('2026-11-07'); // 6 (Saturday)
 */
export function weekdayOf(date: ISODate): Weekday {
  // Epoch day 0 (1970-01-01) was a Thursday.
  return ((((toEpochDay(date) + 4) % 7) + 7) % 7) as Weekday;
}

/**
 * Comparator for sorting dates ascending.
 *
 * @example
 * ['2026-02-01', '2026-01-01'].sort(compareDates); // ['2026-01-01', '2026-02-01']
 */
export function compareDates(a: ISODate, b: ISODate): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Whether `date` lies in `range`, both ends inclusive.
 *
 * @example
 * isInRange('2026-01-31', { from: '2026-01-01', to: '2026-01-31' }); // true
 */
export function isInRange(date: ISODate, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

/**
 * The calendar date at instant `nowMs` in `timeZone` (default: the runtime's
 * zone). The caller supplies the instant — domain code never reads the clock.
 *
 * @example
 * today(Date.UTC(2026, 0, 1, 2), 'America/New_York'); // '2025-12-31'
 */
export function today(nowMs: number, timeZone?: string): ISODate {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(nowMs).map((part) => [part.type, Number(part.value)]),
  );
  return fromParts({
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  });
}

/**
 * The month a date falls in.
 *
 * @example
 * monthOf('2026-11-07'); // '2026-11'
 */
export function monthOf(date: ISODate): ISOMonth {
  return date.slice(0, 7);
}

/**
 * Shifts a month by `amount` months.
 *
 * @example
 * addMonthsToMonth('2026-01', -1); // '2025-12'
 */
export function addMonthsToMonth(month: ISOMonth, amount: number): ISOMonth {
  return monthOf(addMonthsClamped(`${month}-01`, amount));
}

/**
 * First and last day of a month.
 *
 * @example
 * monthRange('2024-02'); // { from: '2024-02-01', to: '2024-02-29' }
 */
export function monthRange(month: ISOMonth): DateRange {
  const from = `${month}-01`;
  return { from, to: lastDayOfMonth(from) };
}
