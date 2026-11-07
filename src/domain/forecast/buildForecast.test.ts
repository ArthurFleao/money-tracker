import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeNetWorth } from '../balances/netWorth';
import { addDays } from '../dates/dates';
import { isOccurrence } from '../recurrence/occurrence';
import {
  dailySchedule,
  makeRecurringRule,
  makeTransaction,
  makeWallet,
  monthlySchedule,
  overrideException,
} from '@/test/factories';
import { buildForecast, type ForecastInput } from './buildForecast';

const TODAY = '2026-03-10';
const wallet = makeWallet({ initialBalanceMinor: 100_000, initialBalanceDate: '2026-01-01' });

function input(overrides: Partial<ForecastInput> = {}): ForecastInput {
  return { wallets: [wallet], transactions: [], rules: [], balanceFloorMinor: 0, ...overrides };
}

const balances = (points: ReturnType<typeof buildForecast>) => points.map((p) => p.balanceMinor);

describe('buildForecast', () => {
  it('is flat over a horizon with no items', () => {
    const points = buildForecast(input(), '2026-03-10', '2026-03-12', TODAY);
    expect(points).toEqual([
      { date: '2026-03-10', balanceMinor: 100_000, deltaMinor: 0, items: [], belowFloor: false },
      { date: '2026-03-11', balanceMinor: 100_000, deltaMinor: 0, items: [], belowFloor: false },
      { date: '2026-03-12', balanceMinor: 100_000, deltaMinor: 0, items: [], belowFloor: false },
    ]);
  });

  it('opens with the cleared balance before the horizon', () => {
    const transactions = [
      makeTransaction({
        walletId: wallet.id,
        kind: 'expense',
        amountMinor: 20_000,
        date: '2026-02-01',
      }),
    ];
    const [first] = buildForecast(input({ transactions }), TODAY, TODAY, TODAY);
    expect(first?.balanceMinor).toBe(80_000);
  });

  it('projects pending transactions from today and ignores overdue ones', () => {
    const transactions = [
      makeTransaction({
        walletId: wallet.id,
        status: 'pending',
        amountMinor: 1_000,
        date: '2026-03-09',
      }),
      makeTransaction({ walletId: wallet.id, status: 'pending', amountMinor: 2_000, date: TODAY }),
      makeTransaction({
        walletId: wallet.id,
        status: 'pending',
        amountMinor: 3_000,
        date: '2026-03-11',
      }),
    ];
    const points = buildForecast(input({ transactions }), TODAY, '2026-03-11', TODAY);
    expect(balances(points)).toEqual([98_000, 95_000]);

    const withoutPending = buildForecast(
      input({ transactions, includePending: false }),
      TODAY,
      '2026-03-11',
      TODAY,
    );
    expect(balances(withoutPending)).toEqual([100_000, 100_000]);
  });

  it('sums several items on the same day and lists them', () => {
    const salary = makeTransaction({
      walletId: wallet.id,
      kind: 'income',
      status: 'pending',
      amountMinor: 50_000,
      date: '2026-03-11',
    });
    const rule = makeRecurringRule({
      walletId: wallet.id,
      amountMinor: 30_000,
      schedule: monthlySchedule({ dayOfMonth: 11, startDate: '2026-01-11' }),
    });
    const [, day] = buildForecast(
      input({ transactions: [salary], rules: [rule] }),
      TODAY,
      '2026-03-11',
      TODAY,
    );
    expect(day?.deltaMinor).toBe(20_000);
    expect(day?.balanceMinor).toBe(120_000);
    expect(day?.items).toHaveLength(2);
    expect(day?.items.filter(isOccurrence)).toHaveLength(1);
  });

  it('projects unposted occurrences from today only, without double counting posted ones', () => {
    const rule = makeRecurringRule({
      walletId: wallet.id,
      amountMinor: 1_000,
      schedule: dailySchedule({ startDate: '2026-03-01' }),
    });
    const postedToday = makeTransaction({
      walletId: wallet.id,
      amountMinor: 1_000,
      date: TODAY,
      recurringRuleId: rule.id,
      occurrenceDate: TODAY,
    });
    const points = buildForecast(
      input({ transactions: [postedToday], rules: [rule] }),
      '2026-03-09',
      '2026-03-12',
      TODAY,
    );
    // 03-09: past, unposted → ignored. 03-10: posted transaction only. 03-11/12: occurrences.
    expect(points.map((p) => p.deltaMinor)).toEqual([0, -1_000, -1_000, -1_000]);
    expect(points[1]?.items).toEqual([postedToday]);
  });

  it('flags days below the floor (strictly)', () => {
    const rule = makeRecurringRule({
      walletId: wallet.id,
      amountMinor: 50_000,
      schedule: dailySchedule({ startDate: '2026-03-11' }),
    });
    const points = buildForecast(
      input({ rules: [rule], balanceFloorMinor: 0 }),
      TODAY,
      '2026-03-13',
      TODAY,
    );
    expect(points.map((p) => [p.balanceMinor, p.belowFloor])).toEqual([
      [100_000, false],
      [50_000, false],
      [0, false],
      [-50_000, true],
    ]);
  });

  it('follows occurrences moved across the horizon edge', () => {
    const rule = makeRecurringRule({
      walletId: wallet.id,
      amountMinor: 1_000,
      schedule: monthlySchedule({ dayOfMonth: 15, startDate: '2026-03-15' }),
      exceptions: [
        overrideException('2026-03-15', { overrideDate: '2026-04-20' }),
        overrideException('2026-05-15', { overrideDate: '2026-04-25' }),
      ],
    });
    const points = buildForecast(input({ rules: [rule] }), TODAY, '2026-04-30', TODAY);
    const movements = points.filter((p) => p.deltaMinor !== 0).map((p) => p.date);
    expect(movements).toEqual(['2026-04-15', '2026-04-20', '2026-04-25']);
  });

  it('supports what-if exclusion of rules', () => {
    const rent = makeRecurringRule({
      walletId: wallet.id,
      schedule: monthlySchedule({ dayOfMonth: 20, startDate: '2026-01-20' }),
    });
    const points = buildForecast(
      input({ rules: [rent], excludedRuleIds: [rent.id] }),
      TODAY,
      '2026-03-31',
      TODAY,
    );
    expect(points.every((p) => p.balanceMinor === 100_000)).toBe(true);
  });

  it('scopes to non-archived wallets by default, or to the given wallets', () => {
    const savings = makeWallet({ initialBalanceMinor: 7_000 });
    const archived = makeWallet({ initialBalanceMinor: 500, archived: true });
    const savingsRule = makeRecurringRule({
      walletId: savings.id,
      amountMinor: 1_000,
      schedule: dailySchedule({ startDate: TODAY }),
    });
    const wallets = [wallet, savings, archived];
    const all = buildForecast(input({ wallets, rules: [savingsRule] }), TODAY, TODAY, TODAY);
    expect(balances(all)).toEqual([106_000]);

    const onlyMain = buildForecast(
      input({ wallets, rules: [savingsRule], walletIds: [wallet.id] }),
      TODAY,
      TODAY,
      TODAY,
    );
    expect(balances(onlyMain)).toEqual([100_000]);

    const onlyArchived = buildForecast(
      input({ wallets, walletIds: [archived.id] }),
      TODAY,
      TODAY,
      TODAY,
    );
    expect(balances(onlyArchived)).toEqual([500]);
  });

  it('ignores items before a wallet opens', () => {
    const late = makeWallet({ initialBalanceMinor: 5_000, initialBalanceDate: '2026-03-12' });
    const rule = makeRecurringRule({
      walletId: late.id,
      amountMinor: 1_000,
      schedule: dailySchedule({ startDate: TODAY }),
    });
    const points = buildForecast(
      input({ wallets: [late], rules: [rule] }),
      TODAY,
      '2026-03-13',
      TODAY,
    );
    expect(balances(points)).toEqual([5_000, 5_000, 4_000, 3_000]);
  });

  it('opens a future window with what is projected between today and its start', () => {
    const rule = makeRecurringRule({
      walletId: wallet.id,
      amountMinor: 1_000,
      schedule: dailySchedule({ startDate: TODAY }),
    });
    const points = buildForecast(input({ rules: [rule] }), '2026-03-20', '2026-03-21', TODAY);
    expect(points.map((p) => p.date)).toEqual(['2026-03-20', '2026-03-21']);
    // 10 occurrences (03-10 … 03-19) before the window, then one per day.
    expect(balances(points)).toEqual([89_000, 88_000]);
  });

  it('shows history for past days', () => {
    const transactions = [
      makeTransaction({ walletId: wallet.id, amountMinor: 1_000, date: '2026-03-01' }),
    ];
    const points = buildForecast(input({ transactions }), '2026-02-28', '2026-03-01', TODAY);
    expect(balances(points)).toEqual([100_000, 99_000]);
  });

  it('returns nothing for an inverted range', () => {
    expect(buildForecast(input(), '2026-03-12', '2026-03-11', TODAY)).toEqual([]);
  });

  it('accumulates deltas and agrees with net worth for cleared history', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            kind: fc.constantFrom('income' as const, 'expense' as const),
            amountMinor: fc.integer({ min: 1, max: 100_000 }),
            offset: fc.integer({ min: -40, max: 40 }),
          }),
        ),
        fc.integer({ min: -30, max: 0 }),
        (rows, fromOffset) => {
          const transactions = rows.map(({ kind, amountMinor, offset }) =>
            makeTransaction({
              walletId: wallet.id,
              kind,
              amountMinor,
              date: addDays(TODAY, offset),
            }),
          );
          const from = addDays(TODAY, fromOffset);
          const points = buildForecast(input({ transactions }), from, TODAY, TODAY);
          let previous = computeNetWorth([wallet], transactions, addDays(from, -1));
          for (const point of points) {
            expect(point.balanceMinor).toBe(previous + point.deltaMinor);
            expect(point.balanceMinor).toBe(computeNetWorth([wallet], transactions, point.date));
            previous = point.balanceMinor;
          }
        },
      ),
    );
  });
});
