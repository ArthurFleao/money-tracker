import { describe, expect, it } from 'vitest';
import {
  HouseholdSchema,
  RecurringRuleSchema,
  ScheduleSchema,
  TransactionSchema,
  WalletSchema,
} from '@/domain/schemas';
import {
  createSequence,
  dailySchedule,
  defineFactory,
  makeHousehold,
  makeRecurringRule,
  makeTransaction,
  makeWallet,
  monthlySchedule,
  weeklySchedule,
  yearlySchedule,
} from './factories';

describe('entity factories', () => {
  it('build schema-valid entities', () => {
    expect(HouseholdSchema.parse(makeHousehold())).toEqual(makeHousehold());
    expect(() => WalletSchema.parse(makeWallet())).not.toThrow();
    expect(() => TransactionSchema.parse(makeTransaction())).not.toThrow();
    expect(() => RecurringRuleSchema.parse(makeRecurringRule())).not.toThrow();
    for (const schedule of [
      dailySchedule(),
      weeklySchedule(),
      monthlySchedule(),
      yearlySchedule(),
    ]) {
      expect(ScheduleSchema.parse(schedule)).toEqual(schedule);
    }
  });

  it('give each entity a fresh id', () => {
    expect(makeWallet().id).not.toBe(makeWallet().id);
    expect(makeTransaction().id).not.toBe(makeTransaction().id);
    expect(makeRecurringRule().id).not.toBe(makeRecurringRule().id);
  });
});

describe('createSequence', () => {
  it('produces deterministic, prefixed, increasing ids', () => {
    const nextId = createSequence('wallet');
    expect([nextId(), nextId(), nextId()]).toEqual(['wallet-1', 'wallet-2', 'wallet-3']);
  });

  it('keeps independent counters per sequence', () => {
    const a = createSequence('a');
    const b = createSequence('b');
    a();
    expect(b()).toBe('b-1');
  });
});

describe('defineFactory', () => {
  const nextId = createSequence('thing');
  const makeThing = defineFactory(() => ({ id: nextId(), label: 'default', tags: [] as string[] }));

  it('builds fresh defaults on every call', () => {
    const first = makeThing();
    const second = makeThing();
    expect(first.id).not.toBe(second.id);
    expect(first.tags).not.toBe(second.tags);
  });

  it('applies overrides on top of defaults', () => {
    expect(makeThing({ label: 'custom' })).toMatchObject({ label: 'custom' });
  });
});
