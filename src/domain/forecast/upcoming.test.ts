import { describe, expect, it } from 'vitest';
import { makeOccurrence, makeTransaction } from '@/test/factories';
import { upcoming } from './upcoming';

describe('upcoming', () => {
  const TODAY = '2026-03-10';

  it('covers today through today + days - 1', () => {
    const items = [
      makeTransaction({ status: 'pending', date: '2026-03-09' }),
      makeTransaction({ status: 'pending', date: TODAY }),
      makeTransaction({ status: 'pending', date: '2026-03-23' }),
      makeTransaction({ status: 'pending', date: '2026-03-24' }),
    ];
    expect(upcoming(items, TODAY, 14).map((i) => i.date)).toEqual([TODAY, '2026-03-23']);
    expect(upcoming(items, TODAY, 0)).toEqual([]);
  });

  it('keeps pending transactions and unposted occurrences only', () => {
    const pending = makeTransaction({ status: 'pending', date: TODAY });
    const cleared = makeTransaction({ status: 'cleared', date: TODAY });
    const due = makeOccurrence({ date: TODAY, originalDate: TODAY });
    const posted = makeOccurrence({ date: TODAY, originalDate: TODAY, posted: true });
    expect(upcoming([pending, cleared, due, posted], TODAY, 1)).toEqual(
      expect.arrayContaining([pending, due]),
    );
    expect(upcoming([pending, cleared, due, posted], TODAY, 1)).toHaveLength(2);
  });

  it('sorts by date, then biggest amount, then description', () => {
    const later = makeOccurrence({ date: '2026-03-12', amountMinor: 999_999 });
    const small = makeTransaction({ status: 'pending', date: TODAY, amountMinor: 100 });
    const bigB = makeOccurrence({ date: TODAY, amountMinor: 5_000, description: 'B' });
    const bigA = makeTransaction({
      status: 'pending',
      date: TODAY,
      amountMinor: 5_000,
      description: 'A',
    });
    expect(upcoming([later, small, bigB, bigA], TODAY, 7)).toEqual([bigA, bigB, small, later]);
  });
});
