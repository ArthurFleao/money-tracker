import { describe, expect, it } from 'vitest';
import {
  dailySchedule,
  makeHousehold,
  makeRecurringRule,
  makeTransaction,
  makeWallet,
  monthlySchedule,
  overrideException,
  skipException,
  weeklySchedule,
  yearlySchedule,
} from '@/test/factories';
import {
  HouseholdSchema,
  ISODateTimeSchema,
  ISOMonthSchema,
  RecurrenceExceptionSchema,
  RecurringRuleSchema,
  requireCurrency,
  ScheduleSchema,
  TransactionSchema,
  WalletSchema,
} from './index';

/** Paths of the issues a failed parse reports. */
function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('common schemas', () => {
  it('validate months and audit timestamps', () => {
    expect(ISOMonthSchema.safeParse('2026-11').success).toBe(true);
    expect(ISOMonthSchema.safeParse('2026-13').success).toBe(false);
    expect(ISODateTimeSchema.safeParse('2026-11-07T16:00:00.000-03:00').success).toBe(true);
    expect(ISODateTimeSchema.safeParse('2026-11-07T16:00:00Z').success).toBe(true);
    expect(ISODateTimeSchema.safeParse('2026-11-07').success).toBe(false);
  });
});

describe('HouseholdSchema', () => {
  it('accepts a valid household', () => {
    expect(HouseholdSchema.safeParse(makeHousehold({ balanceFloorMinor: -5_000 })).success).toBe(
      true,
    );
  });

  it.each([
    ['name', makeHousehold({ name: '   ' })],
    ['baseCurrency', makeHousehold({ baseCurrency: 'XYZ' })],
    ['balanceFloorMinor', makeHousehold({ balanceFloorMinor: 10.5 })],
    ['createdAt', makeHousehold({ createdAt: 'yesterday' })],
  ])('rejects an invalid %s', (path, household) => {
    expect(issuePaths(HouseholdSchema.safeParse(household))).toContain(path);
  });

  it('trims the name', () => {
    expect(HouseholdSchema.parse(makeHousehold({ name: '  Our home ' })).name).toBe('Our home');
  });
});

describe('WalletSchema', () => {
  it('accepts negative balances (credit owed)', () => {
    const wallet = makeWallet({ type: 'credit', initialBalanceMinor: -25_000 });
    expect(WalletSchema.safeParse(wallet).success).toBe(true);
  });

  it.each([
    ['initialBalanceMinor', makeWallet({ initialBalanceMinor: 0.1 })],
    ['initialBalanceMinor', makeWallet({ initialBalanceMinor: Number.MAX_SAFE_INTEGER + 1 })],
    ['initialBalanceDate', makeWallet({ initialBalanceDate: '2026-02-30' })],
    ['currency', makeWallet({ currency: 'usd' })],
    ['householdId', makeWallet({ householdId: '' })],
  ])('rejects an invalid %s', (path, wallet) => {
    expect(issuePaths(WalletSchema.safeParse(wallet))).toContain(path);
  });
});

describe('TransactionSchema', () => {
  it('accepts a transaction posted from a rule', () => {
    const transaction = makeTransaction({
      recurringRuleId: 'rule-1',
      occurrenceDate: '2026-01-31',
      date: '2026-02-02',
    });
    expect(TransactionSchema.safeParse(transaction).success).toBe(true);
  });

  it.each([
    ['amountMinor', makeTransaction({ amountMinor: 0 })],
    ['amountMinor', makeTransaction({ amountMinor: -100 })],
    ['amountMinor', makeTransaction({ amountMinor: 12.34 })],
    ['date', makeTransaction({ date: '2026-1-5' })],
    ['description', makeTransaction({ description: '' })],
    ['occurrenceDate', makeTransaction({ recurringRuleId: 'rule-1' })],
    ['occurrenceDate', makeTransaction({ occurrenceDate: '2026-01-31' })],
  ])('rejects an invalid %s', (path, transaction) => {
    expect(issuePaths(TransactionSchema.safeParse(transaction))).toContain(path);
  });
});

describe('ScheduleSchema', () => {
  it.each([
    ['daily', dailySchedule({ interval: 3 })],
    ['biweekly', weeklySchedule({ interval: 2, weekdays: [1, 5] })],
    ['monthly on the 31st', monthlySchedule({ dayOfMonth: 31 })],
    ['monthly on the last day', monthlySchedule({ dayOfMonth: 'last' })],
    ['yearly on Feb 29', yearlySchedule({ month: 2, dayOfMonth: 29 })],
    ['ending on its start date', dailySchedule({ end: { type: 'onDate', date: '2026-01-01' } })],
    ['ending after 3', dailySchedule({ end: { type: 'afterCount', count: 3 } })],
  ])('accepts %s', (_, schedule) => {
    expect(ScheduleSchema.safeParse(schedule).success).toBe(true);
  });

  it.each([
    ['interval', dailySchedule({ interval: 0 })],
    ['interval', monthlySchedule({ interval: 1.5 })],
    ['startDate', dailySchedule({ startDate: '2026-02-29' })],
    ['weekdays', weeklySchedule({ weekdays: [] })],
    ['weekdays', weeklySchedule({ weekdays: [1, 1] })],
    ['dayOfMonth', monthlySchedule({ dayOfMonth: 32 })],
    ['dayOfMonth', monthlySchedule({ dayOfMonth: 0 })],
    ['dayOfMonth', yearlySchedule({ month: 4, dayOfMonth: 31 })],
    ['dayOfMonth', yearlySchedule({ month: 2, dayOfMonth: 30 })],
    ['month', yearlySchedule({ month: 13 })],
    ['end.date', dailySchedule({ end: { type: 'onDate', date: '2025-12-31' } })],
    ['end.count', dailySchedule({ end: { type: 'afterCount', count: 0 } })],
  ])('rejects an invalid %s', (path, schedule) => {
    expect(issuePaths(ScheduleSchema.safeParse(schedule))).toContain(path);
  });
});

describe('RecurrenceExceptionSchema', () => {
  it.each([
    skipException('2026-03-01'),
    overrideException('2026-03-01', { overrideAmountMinor: 500 }),
    overrideException('2026-03-01', { overrideDate: '2026-03-03' }),
    overrideException('2026-03-01', { overrideAmountMinor: 500, overrideDate: '2026-03-03' }),
  ])('accepts %j', (exception) => {
    expect(RecurrenceExceptionSchema.safeParse(exception).success).toBe(true);
  });

  it.each([
    { ...skipException('2026-03-01'), overrideAmountMinor: 500 },
    { ...skipException('2026-03-01'), overrideDate: '2026-03-03' },
    overrideException('2026-03-01', {}),
    overrideException('2026-03-01', { overrideAmountMinor: 0 }),
    { ...skipException('2026-03-01'), action: 'move' },
  ])('rejects %j', (exception) => {
    expect(RecurrenceExceptionSchema.safeParse(exception).success).toBe(false);
  });
});

describe('RecurringRuleSchema', () => {
  it('rejects two exceptions for the same date', () => {
    const rule = makeRecurringRule({
      exceptions: [
        skipException('2026-03-01'),
        overrideException('2026-03-01', { overrideAmountMinor: 1 }),
      ],
    });
    expect(issuePaths(RecurringRuleSchema.safeParse(rule))).toContain('exceptions');
  });

  it('rejects a non-positive amount and an invalid schedule', () => {
    const rule = makeRecurringRule({ amountMinor: 0, schedule: monthlySchedule({ interval: 0 }) });
    expect(issuePaths(RecurringRuleSchema.safeParse(rule))).toEqual(
      expect.arrayContaining(['amountMinor', 'schedule.interval']),
    );
  });
});

describe('requireCurrency', () => {
  it('only accepts the household base currency', () => {
    const schema = requireCurrency(WalletSchema, 'BRL');
    expect(schema.safeParse(makeWallet({ currency: 'BRL' })).success).toBe(true);
    const result = schema.safeParse(makeWallet({ currency: 'USD' }));
    expect(issuePaths(result)).toEqual(['currency']);
    expect(result.error?.issues[0]?.message).toBe(
      'Currency must be the household base currency (BRL)',
    );
  });

  it('keeps the refinements of the wrapped schema', () => {
    const schema = requireCurrency(TransactionSchema, 'USD');
    expect(schema.safeParse(makeTransaction({ recurringRuleId: 'rule-1' })).success).toBe(false);
  });
});
