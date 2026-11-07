import { type CurrencyCode, currencyExponent } from './currencies';

/** Integer amount in minor units (cents). Never a float (PLAN.md §4.5). */
export type Minor = number;

/** Why `parse` rejected an input. */
export type ParseError = 'empty' | 'invalid' | 'tooPrecise' | 'outOfRange';

/** Result of `parse`: an amount in minor units or a reason it was rejected. */
export type ParseResult = { ok: true; amountMinor: Minor } | { ok: false; error: ParseError };

/** Options for `format`. */
export interface FormatOptions {
  /** Same as `Intl.NumberFormat`'s `signDisplay`. Default `'auto'`. */
  signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';
}

function checked(value: number): Minor {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Not a safe integer amount in minor units: ${value}`);
  }
  // Normalise -0 so it never leaks into formatting or equality checks.
  return value + 0;
}

/**
 * Adds two amounts. Throws `RangeError` if an input or the result is not a safe integer.
 *
 * @example
 * add(1050, 250); // 1300
 */
export function add(a: Minor, b: Minor): Minor {
  return checked(checked(a) + checked(b));
}

/**
 * Subtracts `b` from `a`. Throws `RangeError` if an input or the result is not a safe integer.
 *
 * @example
 * subtract(1000, 2550); // -1550
 */
export function subtract(a: Minor, b: Minor): Minor {
  return checked(checked(a) - checked(b));
}

/**
 * Multiplies an amount by a factor and rounds half away from zero to whole minor units.
 *
 * @example
 * multiply(1000, 3); // 3000
 * multiply(1000, 52 / 12); // 4333 — a weekly amount as a monthly equivalent
 * multiply(-5, 0.5); // -3
 */
export function multiply(amount: Minor, factor: number): Minor {
  if (!Number.isFinite(factor)) throw new RangeError(`Invalid factor: ${factor}`);
  const raw = checked(amount) * factor;
  return checked(Math.sign(raw) * Math.round(Math.abs(raw)));
}

/**
 * Sums a list of amounts (`0` for an empty list).
 *
 * @example
 * sum([100, 250, -50]); // 300
 */
export function sum(amounts: readonly Minor[]): Minor {
  return amounts.reduce(add, 0);
}

/**
 * Exact decimal representation of an amount, e.g. for editable inputs.
 *
 * @example
 * toDecimalString(-123456, 'USD'); // '-1234.56'
 * toDecimalString(5, 'KWD'); // '0.005'
 * toDecimalString(1200, 'JPY'); // '1200'
 */
export function toDecimalString(amountMinor: Minor, currency: CurrencyCode): string {
  const exponent = currencyExponent(currency);
  const value = checked(amountMinor);
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(value)).padStart(exponent + 1, '0');
  if (exponent === 0) return sign + digits;
  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats an amount as currency for a locale. Uses the currency's own minor
 * digits and formats from an exact decimal string, so no float is involved.
 *
 * @example
 * format(123456, 'USD', 'en-US'); // '$1,234.56'
 * format(-123456, 'BRL', 'pt-BR'); // '-R$ 1.234,56' (with a non-breaking space)
 * format(1200, 'JPY', 'ja-JP'); // '￥1,200'
 * format(500, 'USD', 'en-US', { signDisplay: 'always' }); // '+$5.00'
 */
export function format(
  amountMinor: Minor,
  currency: CurrencyCode,
  locale: string,
  options: FormatOptions = {},
): string {
  const exponent = currencyExponent(currency);
  const signDisplay = options.signDisplay ?? 'auto';
  const key = `${locale}|${currency}|${signDisplay}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
      signDisplay,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(toDecimalString(amountMinor, currency) as `${number}`);
}

interface LocaleNumberSymbols {
  group: string;
  decimal: string;
  /** Strings removed before parsing: currency symbols/codes and bidi marks. */
  noise: readonly string[];
  /** Locale minus signs, normalised to `-`. */
  minusSigns: readonly string[];
  /** Native digit → ASCII digit (empty for Latin digits). */
  digits: ReadonlyMap<string, string>;
}

const SPACE_PATTERN = /[\s\u00A0\u2007\u202F]/g;
const APOSTROPHES = ["'", '\u2019'];
const BIDI_MARKS = ['\u200E', '\u200F', '\u061C'];
const symbolCache = new Map<string, LocaleNumberSymbols>();

function partsOf(formatter: Intl.NumberFormat, value: number): Map<string, string> {
  return new Map(formatter.formatToParts(value).map((part) => [part.type, part.value]));
}

function localeSymbols(locale: string, currency: CurrencyCode): LocaleNumberSymbols {
  const key = `${locale}|${currency}`;
  const cached = symbolCache.get(key);
  if (cached) return cached;

  const number = partsOf(new Intl.NumberFormat(locale), -1234567.8);
  const group = String(number.get('group'));
  const currencyLabels = [locale, 'en'].flatMap((labelLocale) =>
    (['symbol', 'narrowSymbol', 'code'] as const).map((currencyDisplay) =>
      String(
        partsOf(
          new Intl.NumberFormat(labelLocale, { style: 'currency', currency, currencyDisplay }),
          1,
        ).get('currency'),
      ),
    ),
  );
  const nativeDigits = Array.from(
    new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210),
  );

  const symbols: LocaleNumberSymbols = {
    // Space-like separators (U+00A0, U+202F, …) are canonicalised to a plain space.
    group: group.replace(SPACE_PATTERN, '') === '' ? ' ' : group,
    decimal: String(number.get('decimal')),
    noise: [...currencyLabels, currency.toLowerCase(), ...BIDI_MARKS].sort(
      (a, b) => b.length - a.length,
    ),
    minusSigns: [String(number.get('minusSign')), '\u2212'],
    digits: new Map(
      nativeDigits
        .map((digit, index) => [digit, String(9 - index)] as const)
        .filter(([digit, ascii]) => digit !== ascii),
    ),
  };
  symbolCache.set(key, symbols);
  return symbols;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalise(input: string, symbols: LocaleNumberSymbols): string {
  let text = input;
  for (const noise of symbols.noise) text = text.split(noise).join('');
  for (const minus of symbols.minusSigns) text = text.split(minus).join('-');
  text = Array.from(text, (char) => symbols.digits.get(char) ?? char).join('');
  if (APOSTROPHES.includes(symbols.group)) {
    for (const apostrophe of APOSTROPHES) text = text.split(apostrophe).join(symbols.group);
  }
  return text
    .replace(SPACE_PATTERN, symbols.group === ' ' ? ' ' : '')
    .trim()
    .replace(/^([+-]) +/, '$1');
}

/** `1,234,567` or Indian `12,34,567` — any other placement of the separator is rejected. */
function hasValidGrouping(integer: string, group: string): boolean {
  if (!integer.includes(group)) return /^\d*$/.test(integer);
  const g = escapeRegExp(group);
  return (
    new RegExp(`^\\d{1,3}(?:${g}\\d{3})+$`).test(integer) ||
    new RegExp(`^\\d{1,2}(?:${g}\\d{2})*${g}\\d{3}$`).test(integer)
  );
}

/**
 * Parses user input into minor units using the locale's separators. Accepts
 * an optional sign, the currency's symbol or code (local or English form),
 * native digits and grouping separators in valid positions only — so `"1.5"`
 * in `pt-BR` is rejected rather than silently read as 15. Never uses floats.
 *
 * @example
 * parse('1,234.56', 'USD', 'en-US'); // { ok: true, amountMinor: 123456 }
 * parse('1.234,56', 'BRL', 'pt-BR'); // { ok: true, amountMinor: 123456 }
 * parse('R$ -10', 'BRL', 'pt-BR'); // { ok: true, amountMinor: -1000 }
 * parse('1.5', 'JPY', 'ja-JP'); // { ok: false, error: 'tooPrecise' }
 */
export function parse(input: string, currency: CurrencyCode, locale: string): ParseResult {
  const exponent = currencyExponent(currency);
  if (input.trim() === '') return { ok: false, error: 'empty' };

  const symbols = localeSymbols(locale, currency);
  const group = escapeRegExp(symbols.group);
  const decimal = escapeRegExp(symbols.decimal);
  const match = new RegExp(`^([+-]?)([\\d${group}]*)(?:${decimal}(\\d*))?$`).exec(
    normalise(input, symbols),
  );
  if (!match) return { ok: false, error: 'invalid' };

  const sign = match[1];
  const integer = String(match[2]);
  const fraction = match[3] ?? '';
  if ((integer === '' && fraction === '') || !hasValidGrouping(integer, symbols.group)) {
    return { ok: false, error: 'invalid' };
  }
  if (/[^0]/.test(fraction.slice(exponent))) return { ok: false, error: 'tooPrecise' };

  const digits =
    integer.split(symbols.group).join('') + fraction.padEnd(exponent, '0').slice(0, exponent);
  const magnitude = Number(digits);
  if (!Number.isSafeInteger(magnitude)) return { ok: false, error: 'outOfRange' };
  return { ok: true, amountMinor: (sign === '-' ? -magnitude : magnitude) + 0 };
}
