import { z } from 'zod';
import { isValidISODate, isValidISOMonth } from '../dates/dates';
import { type CurrencyCode, isCurrencyCode } from '../money/currencies';

/** Entity id (`crypto.randomUUID()` in the app; any non-empty string is accepted). */
export const IdSchema = z.string().min(1);

/** Calendar date `YYYY-MM-DD` that exists (rejects `2026-02-30`). */
export const ISODateSchema = z
  .string()
  .refine(isValidISODate, { message: 'Expected a calendar date (YYYY-MM-DD)' });

/** Calendar month `YYYY-MM`. */
export const ISOMonthSchema = z
  .string()
  .refine(isValidISOMonth, { message: 'Expected a month (YYYY-MM)' });

/** Audit timestamp: full ISO 8601 with an offset. */
export const ISODateTimeSchema = z.iso.datetime({ offset: true });

/** Integer amount in minor units (any sign). Rejects floats and unsafe integers. */
export const MinorSchema = z.int();

/** Strictly positive integer amount in minor units — `kind` carries the sign. */
export const PositiveMinorSchema = z.int().positive();

/** ISO 4217 code from the built-in currency table. */
export const CurrencyCodeSchema = z
  .string()
  .refine(isCurrencyCode, { message: 'Unknown ISO 4217 currency code' });

/** `income` (UI: Earning) or `expense` (UI: Debt). */
export const KindSchema = z.enum(['income', 'expense']);
export type Kind = z.infer<typeof KindSchema>;

/** Short user-entered label (wallet, household and description names). */
export const LabelSchema = z.string().trim().min(1).max(120);

/** Free-form user notes. */
export const NotesSchema = z.string().max(2000);

/**
 * Adds the MVP rule "every entity uses the household base currency"
 * (PLAN.md §4.3) to a schema that has a `currency` field.
 *
 * @example
 * requireCurrency(WalletSchema, household.baseCurrency).parse(wallet);
 */
export function requireCurrency<T extends z.ZodType<{ currency: string }>>(
  schema: T,
  currency: CurrencyCode,
): T {
  return schema.refine((entity) => entity.currency === currency, {
    path: ['currency'],
    message: `Currency must be the household base currency (${currency})`,
  });
}
