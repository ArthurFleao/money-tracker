import { describe, expect, it } from 'vitest';
import {
  makeOccurrence,
  makeTransaction,
  overrideException,
  skipException,
} from '@/test/factories';
import { applyException, removeException, upsertException } from './exceptions';
import { isOccurrence, signedAmount } from './occurrence';

describe('applyException', () => {
  const occurrence = makeOccurrence({ date: '2026-02-01', originalDate: '2026-02-01' });

  it('leaves the occurrence alone without an exception', () => {
    expect(applyException(occurrence, undefined)).toBe(occurrence);
  });

  it('removes a skipped occurrence', () => {
    expect(applyException(occurrence, skipException('2026-02-01'))).toBeUndefined();
  });

  it('applies amount and date overrides independently', () => {
    expect(
      applyException(occurrence, overrideException('2026-02-01', { overrideAmountMinor: 5 })),
    ).toEqual({ ...occurrence, amountMinor: 5 });
    expect(
      applyException(occurrence, overrideException('2026-02-01', { overrideDate: '2026-02-03' })),
    ).toEqual({ ...occurrence, date: '2026-02-03' });
  });
});

describe('upsertException / removeException', () => {
  const exceptions = [skipException('2026-03-01'), skipException('2026-01-01')];

  it('adds or replaces by date and keeps the list sorted', () => {
    const replaced = upsertException(
      exceptions,
      overrideException('2026-01-01', { overrideAmountMinor: 9 }),
    );
    expect(replaced).toEqual([
      overrideException('2026-01-01', { overrideAmountMinor: 9 }),
      skipException('2026-03-01'),
    ]);
    expect(upsertException(exceptions, skipException('2026-02-01')).map((e) => e.date)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ]);
  });

  it('removes (reverts) the exception for a date without mutating the input', () => {
    expect(removeException(exceptions, '2026-03-01')).toEqual([skipException('2026-01-01')]);
    expect(exceptions).toHaveLength(2);
  });
});

describe('ledger item helpers', () => {
  it('tells occurrences from transactions', () => {
    expect(isOccurrence(makeOccurrence())).toBe(true);
    expect(isOccurrence(makeTransaction())).toBe(false);
  });

  it('signs amounts by kind', () => {
    expect(signedAmount(makeTransaction({ kind: 'income', amountMinor: 500 }))).toBe(500);
    expect(signedAmount(makeOccurrence({ kind: 'expense', amountMinor: 500 }))).toBe(-500);
  });
});
