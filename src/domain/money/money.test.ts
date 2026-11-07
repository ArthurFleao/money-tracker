import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { money } from '@/domain/money';
import { CURRENCIES, currencyExponent, isCurrencyCode } from './currencies';
import { add, format, multiply, parse, subtract, sum, toDecimalString } from './money';

/** Replace the non-breaking spaces Intl uses so expectations stay readable. */
const plain = (text: string): string => text.replace(/[\u00A0\u202F]/g, ' ');

it('is exposed as the `money` namespace (AGENTS.md rule 2)', () => {
  expect(money.parse('10', 'USD', 'en-US')).toEqual({ ok: true, amountMinor: 1000 });
  expect(money.format(1000, 'USD', 'en-US')).toBe('$10.00');
});

describe('currencies', () => {
  it('knows 0-, 2- and 3-decimal currencies', () => {
    expect(currencyExponent('JPY')).toBe(0);
    expect(currencyExponent('USD')).toBe(2);
    expect(currencyExponent('BRL')).toBe(2);
    expect(currencyExponent('KWD')).toBe(3);
  });

  it('rejects unknown or lower-case codes', () => {
    expect(isCurrencyCode('EUR')).toBe(true);
    expect(isCurrencyCode('eur')).toBe(false);
    expect(isCurrencyCode('XXX')).toBe(false);
    expect(() => currencyExponent('ABC')).toThrow('Unknown currency: "ABC"');
  });

  it('lists unique, sorted, 3-letter codes that Intl can format', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual([...codes].sort());
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect(() => format(1, code, 'en-US')).not.toThrow();
    }
  });
});

describe('arithmetic', () => {
  it('adds, subtracts and sums integers', () => {
    expect(add(1050, 250)).toBe(1300);
    expect(subtract(1000, 2550)).toBe(-1550);
    expect(sum([100, 250, -50])).toBe(300);
    expect(sum([])).toBe(0);
  });

  it('multiplies and rounds half away from zero', () => {
    expect(multiply(1000, 3)).toBe(3000);
    expect(multiply(1000, 52 / 12)).toBe(4333);
    expect(multiply(5, 0.5)).toBe(3);
    expect(multiply(-5, 0.5)).toBe(-3);
    expect(multiply(-1, 0.4)).toBe(0);
    expect(Object.is(multiply(-1, 0.4), -0)).toBe(false);
  });

  it('rejects floats and unsafe integers', () => {
    expect(() => add(0.1, 0.2)).toThrow(RangeError);
    expect(() => subtract(1, 0.5)).toThrow(RangeError);
    expect(() => add(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError);
    expect(() => multiply(10.5, 2)).toThrow(RangeError);
    expect(() => multiply(10, Number.NaN)).toThrow('Invalid factor: NaN');
    expect(() => multiply(10, Infinity)).toThrow(RangeError);
  });

  it('add and subtract are inverse', () => {
    const amount = fc.integer({ min: -1e12, max: 1e12 });
    fc.assert(
      fc.property(amount, amount, (a, b) => {
        expect(subtract(add(a, b), b)).toBe(a);
      }),
    );
  });
});

describe('toDecimalString', () => {
  it('renders exact decimals for every exponent', () => {
    expect(toDecimalString(-123456, 'USD')).toBe('-1234.56');
    expect(toDecimalString(5, 'USD')).toBe('0.05');
    expect(toDecimalString(5, 'KWD')).toBe('0.005');
    expect(toDecimalString(1200, 'JPY')).toBe('1200');
    expect(toDecimalString(-0, 'USD')).toBe('0.00');
  });
});

describe('format', () => {
  it('formats with the currency minor digits', () => {
    expect(format(123456, 'USD', 'en-US')).toBe('$1,234.56');
    expect(plain(format(123456, 'BRL', 'pt-BR'))).toBe('R$ 1.234,56');
    expect(plain(format(123456, 'EUR', 'de-DE'))).toBe('1.234,56 €');
    expect(format(1200, 'JPY', 'en-US')).toBe('¥1,200');
    expect(plain(format(1234567, 'KWD', 'en-US'))).toBe('KWD 1,234.567');
  });

  it('formats negative amounts', () => {
    expect(format(-123456, 'USD', 'en-US')).toBe('-$1,234.56');
    expect(plain(format(-123456, 'BRL', 'pt-BR'))).toBe('-R$ 1.234,56');
    expect(format(-1, 'JPY', 'en-US')).toBe('-¥1');
  });

  it('supports signDisplay', () => {
    expect(format(500, 'USD', 'en-US', { signDisplay: 'always' })).toBe('+$5.00');
    expect(format(0, 'USD', 'en-US', { signDisplay: 'exceptZero' })).toBe('$0.00');
    expect(format(-500, 'USD', 'en-US', { signDisplay: 'never' })).toBe('$5.00');
  });

  it('is exact beyond float precision', () => {
    expect(format(Number.MAX_SAFE_INTEGER, 'USD', 'en-US')).toBe('$90,071,992,547,409.91');
  });

  it('throws on floats', () => {
    expect(() => format(1.5, 'USD', 'en-US')).toThrow(RangeError);
  });
});

describe('parse', () => {
  it.each([
    ['1,234.56', 'USD', 'en-US', 123456],
    ['1234.56', 'USD', 'en-US', 123456],
    ['$1,234.56', 'USD', 'en-US', 123456],
    ['  -$12.5 ', 'USD', 'en-US', -1250],
    ['+7', 'USD', 'en-US', 700],
    ['.5', 'USD', 'en-US', 50],
    ['5.', 'USD', 'en-US', 500],
    ['1.500', 'USD', 'en-US', 150],
    ['USD 10', 'USD', 'en-US', 1000],
    ['10 usd', 'USD', 'en-US', 1000],
    ['-0', 'USD', 'en-US', 0],
    ['1.234,56', 'BRL', 'pt-BR', 123456],
    ['R$ 1.234,56', 'BRL', 'pt-BR', 123456],
    ['- R$ 10', 'BRL', 'pt-BR', -1000],
    ['1.234', 'BRL', 'pt-BR', 123400],
    ['1 234,56 €', 'EUR', 'fr-FR', 123456],
    ['1\u202F234,56\u00A0€', 'EUR', 'fr-FR', 123456],
    ["1'234.56", 'CHF', 'de-CH', 123456],
    ['1’234.56', 'CHF', 'de-CH', 123456],
    ['12,34,567.89', 'INR', 'en-IN', 123456789],
    ['1,234', 'JPY', 'ja-JP', 1234],
    ['¥1,234', 'JPY', 'ja-JP', 1234],
    ['1.234', 'KWD', 'en-US', 1234],
    ['١٬٢٣٤٫٥٦', 'EGP', 'ar-EG', 123456],
    ['\u2212123,45', 'SEK', 'sv-SE', -12345],
  ])('parses %j as %s in %s', (input, currency, locale, expected) => {
    expect(parse(input, currency, locale)).toEqual({ ok: true, amountMinor: expected });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'invalid'],
    ['-', 'invalid'],
    ['.', 'invalid'],
    ['1.234,56', 'invalid'],
    ['1,23', 'invalid'],
    ['12,3456', 'invalid'],
    ['1..2', 'invalid'],
    ['--1', 'invalid'],
    ['1.234', 'tooPrecise'],
    ['99999999999999999999', 'outOfRange'],
  ])('rejects %j in en-US USD as %s', (input, error) => {
    expect(parse(input, 'USD', 'en-US')).toEqual({ ok: false, error });
  });

  it('reads the separators from the locale', () => {
    expect(parse('1.234,56', 'EUR', 'de-DE')).toEqual({ ok: true, amountMinor: 123456 });
    expect(parse('1,234.56', 'EUR', 'de-DE')).toEqual({ ok: false, error: 'invalid' });
    // In pt-BR "." groups thousands; "1.5" is not a valid grouping, so it is
    // rejected instead of being silently read as 15.
    expect(parse('1.5', 'BRL', 'pt-BR')).toEqual({ ok: false, error: 'invalid' });
  });

  it('rejects fractions a zero-decimal currency cannot hold', () => {
    expect(parse('1.5', 'JPY', 'ja-JP')).toEqual({ ok: false, error: 'tooPrecise' });
    expect(parse('1.0', 'JPY', 'ja-JP')).toEqual({ ok: true, amountMinor: 1 });
  });

  it('throws for unknown currencies', () => {
    expect(() => parse('1', 'ABC', 'en-US')).toThrow(RangeError);
  });

  const locales = [
    'en-US',
    'pt-BR',
    'de-DE',
    'fr-FR',
    'de-CH',
    'en-IN',
    'ja-JP',
    'ar-EG',
    'fa-IR',
    'he-IL',
    'nl-NL',
    'sv-SE',
  ];
  const currencies = ['USD', 'BRL', 'EUR', 'JPY', 'KWD', 'INR', 'CHF'];

  it('round-trips everything format produces', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e13, max: 1e13 }),
        fc.constantFrom(...currencies),
        fc.constantFrom(...locales),
        fc.constantFrom('auto' as const, 'always' as const),
        (amount, currency, locale, signDisplay) => {
          const text = format(amount, currency, locale, { signDisplay });
          expect(parse(text, currency, locale)).toEqual({ ok: true, amountMinor: amount });
        },
      ),
      { numRuns: 500 },
    );
  });

  it('round-trips the exact decimal string', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e13, max: 1e13 }),
        fc.constantFrom('USD', 'JPY', 'KWD'),
        (amount, currency) => {
          expect(parse(toDecimalString(amount, currency), currency, 'en-US')).toEqual({
            ok: true,
            amountMinor: amount,
          });
        },
      ),
    );
  });
});
