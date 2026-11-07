/** ISO 4217 alphabetic currency code, e.g. `'USD'`, `'BRL'`, `'EUR'`. */
export type CurrencyCode = string;

/** Number of minor-unit digits a currency uses (PLAN.md §4.5). */
export type CurrencyExponent = 0 | 2 | 3;

/** One entry of the built-in currency table. */
export interface CurrencyInfo {
  code: CurrencyCode;
  exponent: CurrencyExponent;
}

const ZERO_DECIMAL = 'BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX VND VUV XAF XOF XPF';
const THREE_DECIMAL = 'BHD IQD JOD KWD LYD OMR TND';
const TWO_DECIMAL =
  'AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF ' +
  'CHF CNY COP CRC CUP CVE CZK DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GTQ GYD ' +
  'HKD HNL HTG HUF IDR ILS INR IRR JMD KES KGS KHR KPW KYD KZT LAK LBP LKR LRD LSL MAD MDL MGA ' +
  'MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD PAB PEN PGK PHP PKR PLN ' +
  'QAR RON RSD RUB SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TOP ' +
  'TRY TTD TWD TZS UAH USD UYU UZS VED VES WST XCD XCG YER ZAR ZMW ZWG';

function entries(codes: string, exponent: CurrencyExponent): CurrencyInfo[] {
  return codes.split(' ').map((code) => ({ code, exponent }));
}

/**
 * Active ISO 4217 currencies (funds, metals and test codes excluded), sorted by
 * code. Display names come from `Intl.DisplayNames` in the UI.
 *
 * @example
 * CURRENCIES.find((c) => c.code === 'KWD'); // { code: 'KWD', exponent: 3 }
 */
export const CURRENCIES: readonly CurrencyInfo[] = [
  ...entries(ZERO_DECIMAL, 0),
  ...entries(TWO_DECIMAL, 2),
  ...entries(THREE_DECIMAL, 3),
].sort((a, b) => a.code.localeCompare(b.code));

const EXPONENTS = new Map(CURRENCIES.map(({ code, exponent }) => [code, exponent]));

/**
 * Whether `code` is a currency in the built-in table.
 *
 * @example
 * isCurrencyCode('BRL'); // true
 * isCurrencyCode('brl'); // false
 */
export function isCurrencyCode(code: string): boolean {
  return EXPONENTS.has(code);
}

/**
 * Minor-unit digits for a currency. Throws `RangeError` for unknown codes.
 *
 * @example
 * currencyExponent('JPY'); // 0
 * currencyExponent('USD'); // 2
 * currencyExponent('KWD'); // 3
 */
export function currencyExponent(code: CurrencyCode): CurrencyExponent {
  const exponent = EXPONENTS.get(code);
  if (exponent === undefined) throw new RangeError(`Unknown currency: "${code}"`);
  return exponent;
}
