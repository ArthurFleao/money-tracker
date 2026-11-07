/**
 * Test-data builders. Tests must build entities through these factories,
 * never through inline object literals (AGENTS.md §5). Every factory returns a
 * schema-valid entity in the test household and currency.
 */
import type { Occurrence } from '@/domain/recurrence';
import type {
  Household,
  RecurrenceException,
  RecurringRule,
  Schedule,
  Transaction,
  Wallet,
} from '@/domain/schemas';

export const TEST_HOUSEHOLD_ID = 'household-1';
export const TEST_CURRENCY = 'USD';
export const TEST_TIMESTAMP = '2026-01-01T00:00:00.000Z';

/**
 * Creates a deterministic, monotonically increasing id generator.
 *
 * @example
 * const nextId = createSequence('wallet');
 * nextId(); // 'wallet-1'
 * nextId(); // 'wallet-2'
 */
export function createSequence(prefix: string): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

/**
 * Defines a factory that merges overrides onto fresh defaults on every call.
 * `defaults` is a function so each built object gets new ids and nested values.
 *
 * @example
 * const makeUser = defineFactory(() => ({ id: nextId(), name: 'Ada' }));
 * makeUser({ name: 'Grace' }); // { id: 'user-1', name: 'Grace' }
 */
export function defineFactory<T extends object>(defaults: () => T): (overrides?: Partial<T>) => T {
  return (overrides = {}) => ({ ...defaults(), ...overrides });
}

const audit = { createdAt: TEST_TIMESTAMP, updatedAt: TEST_TIMESTAMP };
const nextWalletId = createSequence('wallet');
const nextTransactionId = createSequence('transaction');
const nextRuleId = createSequence('rule');

/**
 * The (single) test household.
 *
 * @example
 * makeHousehold({ balanceFloorMinor: 10_000 });
 */
export const makeHousehold = defineFactory<Household>(() => ({
  id: TEST_HOUSEHOLD_ID,
  name: 'Home',
  baseCurrency: TEST_CURRENCY,
  balanceFloorMinor: 0,
  weekStartsOn: 1,
  memberIds: [],
  ...audit,
}));

/**
 * A checking wallet with a zero balance anchored on 2026-01-01.
 *
 * @example
 * makeWallet({ initialBalanceMinor: 100_000, type: 'savings' });
 */
export const makeWallet = defineFactory<Wallet>(() => ({
  id: nextWalletId(),
  householdId: TEST_HOUSEHOLD_ID,
  name: 'Checking',
  type: 'checking',
  currency: TEST_CURRENCY,
  initialBalanceMinor: 0,
  initialBalanceDate: '2026-01-01',
  color: 'violet',
  icon: 'wallet',
  archived: false,
  sortOrder: 0,
  ...audit,
}));

/**
 * A cleared $10.00 expense on 2026-01-15 in `wallet-1`.
 *
 * @example
 * makeTransaction({ walletId: wallet.id, kind: 'income', amountMinor: 500_000 });
 */
export const makeTransaction = defineFactory<Transaction>(() => ({
  id: nextTransactionId(),
  householdId: TEST_HOUSEHOLD_ID,
  walletId: 'wallet-1',
  kind: 'expense',
  amountMinor: 1_000,
  currency: TEST_CURRENCY,
  date: '2026-01-15',
  description: 'Groceries',
  status: 'cleared',
  ...audit,
}));

type ScheduleOf<F extends Schedule['frequency']> = Extract<Schedule, { frequency: F }>;
type ScheduleOverrides<F extends Schedule['frequency']> = Partial<Omit<ScheduleOf<F>, 'frequency'>>;

const scheduleDefaults = {
  interval: 1,
  startDate: '2026-01-01',
  end: { type: 'never' },
} as const;

/**
 * Every day from 2026-01-01, forever.
 *
 * @example
 * dailySchedule({ interval: 3 });
 */
export function dailySchedule(overrides: ScheduleOverrides<'daily'> = {}): ScheduleOf<'daily'> {
  return { frequency: 'daily', ...scheduleDefaults, ...overrides };
}

/**
 * Every Monday from 2026-01-01, forever.
 *
 * @example
 * weeklySchedule({ interval: 2, weekdays: [5] }); // biweekly on Fridays
 */
export function weeklySchedule(overrides: ScheduleOverrides<'weekly'> = {}): ScheduleOf<'weekly'> {
  return { frequency: 'weekly', ...scheduleDefaults, weekdays: [1], ...overrides };
}

/**
 * The 1st of every month from 2026-01-01, forever.
 *
 * @example
 * monthlySchedule({ dayOfMonth: 'last' });
 */
export function monthlySchedule(
  overrides: ScheduleOverrides<'monthly'> = {},
): ScheduleOf<'monthly'> {
  return { frequency: 'monthly', ...scheduleDefaults, dayOfMonth: 1, ...overrides };
}

/**
 * Every January 1st from 2026-01-01, forever.
 *
 * @example
 * yearlySchedule({ month: 2, dayOfMonth: 29, startDate: '2024-02-29' });
 */
export function yearlySchedule(overrides: ScheduleOverrides<'yearly'> = {}): ScheduleOf<'yearly'> {
  return { frequency: 'yearly', ...scheduleDefaults, month: 1, dayOfMonth: 1, ...overrides };
}

/**
 * A skip exception for the occurrence originally on `date`.
 *
 * @example
 * makeRecurringRule({ exceptions: [skipException('2026-03-01')] });
 */
export function skipException(date: string): RecurrenceException {
  return { date, action: 'skip' };
}

/**
 * An override exception changing the amount and/or date of one occurrence.
 *
 * @example
 * overrideException('2026-03-01', { overrideAmountMinor: 120_000 });
 * overrideException('2026-03-01', { overrideDate: '2026-03-03' });
 */
export function overrideException(
  date: string,
  changes: Pick<RecurrenceException, 'overrideAmountMinor' | 'overrideDate'>,
): RecurrenceException {
  return { date, action: 'override', ...changes };
}

/**
 * A $1,000.00 monthly expense ("Rent") on the 1st in `wallet-1`, not auto-posted.
 *
 * @example
 * makeRecurringRule({ kind: 'income', schedule: monthlySchedule({ dayOfMonth: 5 }) });
 */
export const makeRecurringRule = defineFactory<RecurringRule>(() => ({
  id: nextRuleId(),
  householdId: TEST_HOUSEHOLD_ID,
  walletId: 'wallet-1',
  kind: 'expense',
  amountMinor: 100_000,
  currency: TEST_CURRENCY,
  description: 'Rent',
  schedule: monthlySchedule(),
  autoPost: false,
  exceptions: [],
  active: true,
  ...audit,
}));
/**
 * An unposted $1,000.00 "Rent" occurrence of `rule-1` on 2026-02-01.
 *
 * @example
 * makeOccurrence({ kind: 'income', date: '2026-02-05', originalDate: '2026-02-05' });
 */
export const makeOccurrence = defineFactory<Occurrence>(() => ({
  ruleId: 'rule-1',
  date: '2026-02-01',
  originalDate: '2026-02-01',
  kind: 'expense',
  amountMinor: 100_000,
  walletId: 'wallet-1',
  description: 'Rent',
  posted: false,
}));
