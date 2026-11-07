import { describe, expect, it } from 'vitest';
import { makeOccurrence, makeTransaction } from '@/test/factories';
import { summarizeMonth } from './summarizeMonth';

describe('summarizeMonth', () => {
  const salary = makeTransaction({ kind: 'income', amountMinor: 500_000, date: '2026-02-01' });
  const bonus = makeTransaction({
    kind: 'income',
    amountMinor: 50_000,
    date: '2026-02-28',
    status: 'pending',
  });
  const groceries = makeTransaction({ kind: 'expense', amountMinor: 30_000, date: '2026-02-14' });
  const rent = makeOccurrence({ kind: 'expense', amountMinor: 150_000, date: '2026-02-05' });
  const postedRent = makeOccurrence({
    kind: 'expense',
    amountMinor: 150_000,
    date: '2026-02-05',
    posted: true,
    transactionId: 'transaction-x',
  });
  const january = makeTransaction({ kind: 'expense', amountMinor: 100_000, date: '2026-01-31' });
  const march = makeTransaction({ kind: 'income', amountMinor: 1, date: '2026-03-01' });

  const summary = summarizeMonth(
    [salary, bonus, groceries, january, march],
    [rent, postedRent],
    '2026-02',
  );

  it('totals transactions (any status) and unposted occurrences within the month', () => {
    expect(summary).toMatchObject({
      month: '2026-02',
      incomeMinor: 550_000,
      expenseMinor: 180_000,
      netMinor: 370_000,
      incomeCount: 2,
      expenseCount: 2,
    });
  });

  it('lists the biggest items first', () => {
    expect(summary.topIncome).toEqual([salary, bonus]);
    expect(summary.topExpenses).toEqual([rent, groceries]);
  });

  it('limits and breaks ties deterministically', () => {
    const a = makeTransaction({ amountMinor: 100, date: '2026-02-02', description: 'B' });
    const b = makeTransaction({ amountMinor: 100, date: '2026-02-01', description: 'Z' });
    const c = makeTransaction({ amountMinor: 100, date: '2026-02-02', description: 'A' });
    expect(summarizeMonth([a, b, c], [], '2026-02', { top: 2 }).topExpenses).toEqual([b, c]);
  });

  it('compares with the previous month', () => {
    expect(summary.previous).toEqual({
      incomeMinor: 0,
      expenseMinor: 100_000,
      netMinor: -100_000,
      incomeCount: 0,
      expenseCount: 1,
    });
    expect(summary.change).toEqual({
      incomeMinor: 550_000,
      expenseMinor: 80_000,
      netMinor: 470_000,
    });
  });

  it('is all zeros for an empty month', () => {
    expect(summarizeMonth([], [], '2026-02')).toEqual({
      month: '2026-02',
      incomeMinor: 0,
      expenseMinor: 0,
      netMinor: 0,
      incomeCount: 0,
      expenseCount: 0,
      topIncome: [],
      topExpenses: [],
      previous: { incomeMinor: 0, expenseMinor: 0, netMinor: 0, incomeCount: 0, expenseCount: 0 },
      change: { incomeMinor: 0, expenseMinor: 0, netMinor: 0 },
    });
  });

  it('includes the first and last day of the month, also across a year boundary', () => {
    const first = makeTransaction({ date: '2026-01-01' });
    const last = makeTransaction({ date: '2026-01-31' });
    const december = makeTransaction({ date: '2025-12-31', amountMinor: 7 });
    const result = summarizeMonth([first, last, december], [], '2026-01');
    expect(result.expenseCount).toBe(2);
    expect(result.previous.expenseMinor).toBe(7);
  });
});
