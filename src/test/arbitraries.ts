import fc from 'fast-check';
import { type ISODate, type ISOMonth } from '@/domain/dates/dates';

const MIN_DATE = new Date('1900-01-01T00:00:00.000Z');
const MAX_DATE = new Date('2199-12-31T00:00:00.000Z');

/**
 * Arbitrary calendar dates (1900–2199), generated independently of the domain
 * `dates` module so it can serve as an oracle.
 *
 * @example
 * fc.assert(fc.property(isoDateArb(), (date) => isValidISODate(date)));
 */
export function isoDateArb(min: Date = MIN_DATE, max: Date = MAX_DATE): fc.Arbitrary<ISODate> {
  return fc.date({ min, max, noInvalidDate: true }).map((d) => d.toISOString().slice(0, 10));
}

/**
 * Arbitrary calendar months (1900–2199).
 *
 * @example
 * fc.assert(fc.property(isoMonthArb(), (month) => isValidISOMonth(month)));
 */
export function isoMonthArb(): fc.Arbitrary<ISOMonth> {
  return isoDateArb().map((date) => date.slice(0, 7));
}
