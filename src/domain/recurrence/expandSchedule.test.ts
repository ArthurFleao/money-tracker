import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysInMonth,
  diffInDays,
  eachDayInRange,
  type ISODate,
  weekdayOf,
} from '../dates/dates';
import type { DayOfMonth, RecurringRule, Schedule } from '../schemas/recurringRule';
import { isoDateArb } from '@/test/arbitraries';
import {
  dailySchedule,
  makeRecurringRule,
  makeTransaction,
  monthlySchedule,
  overrideException,
  skipException,
  weeklySchedule,
  yearlySchedule,
} from '@/test/factories';
import { expandSchedule, scheduleDates } from './expandSchedule';
import { markPosted } from './markPosted';

const ruleWith = (schedule: Schedule, overrides: Partial<RecurringRule> = {}): RecurringRule =>
  makeRecurringRule({ schedule, ...overrides });

const datesOf = (rule: RecurringRule, from: ISODate, to: ISODate): ISODate[] =>
  expandSchedule(rule, from, to).map((occurrence) => occurrence.date);

describe('expandSchedule — monthly', () => {
  it('clamps day 31 to the end of short months', () => {
    const rule = ruleWith(monthlySchedule({ dayOfMonth: 31, startDate: '2026-01-01' }));
    expect(datesOf(rule, '2026-01-01', '2026-06-30')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
      '2026-06-30',
    ]);
  });

  it('clamps day 29/30 in February, including leap years', () => {
    const on29 = ruleWith(monthlySchedule({ dayOfMonth: 29, startDate: '2027-12-01' }));
    expect(datesOf(on29, '2028-01-01', '2028-03-31')).toEqual([
      '2028-01-29',
      '2028-02-29',
      '2028-03-29',
    ]);
    const on30 = ruleWith(monthlySchedule({ dayOfMonth: 30, startDate: '2026-01-01' }));
    expect(datesOf(on30, '2026-02-01', '2026-02-28')).toEqual(['2026-02-28']);
  });

  it("uses the last day of each month for 'last'", () => {
    const rule = ruleWith(monthlySchedule({ dayOfMonth: 'last', startDate: '2024-01-01' }));
    expect(datesOf(rule, '2024-01-01', '2024-04-30')).toEqual([
      '2024-01-31',
      '2024-02-29',
      '2024-03-31',
      '2024-04-30',
    ]);
  });

  it('aligns interval > 1 to the start month and skips a first date before the start', () => {
    const quarterly = ruleWith(
      monthlySchedule({ interval: 3, dayOfMonth: 10, startDate: '2026-01-15' }),
    );
    expect(datesOf(quarterly, '2026-01-01', '2026-12-31')).toEqual([
      '2026-04-10',
      '2026-07-10',
      '2026-10-10',
    ]);
  });
});

describe('expandSchedule — yearly', () => {
  it('falls on Feb 28 in common years for a Feb 29 rule', () => {
    const rule = ruleWith(yearlySchedule({ month: 2, dayOfMonth: 29, startDate: '2024-02-29' }));
    expect(datesOf(rule, '2024-01-01', '2028-12-31')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ]);
  });

  it('aligns interval > 1 to the start year', () => {
    const rule = ruleWith(
      yearlySchedule({ interval: 2, month: 6, dayOfMonth: 'last', startDate: '2026-07-01' }),
    );
    expect(datesOf(rule, '2026-01-01', '2032-12-31')).toEqual([
      '2028-06-30',
      '2030-06-30',
      '2032-06-30',
    ]);
  });
});

describe('expandSchedule — weekly and daily', () => {
  it('runs biweekly from the start date', () => {
    // 2026-01-02 is a Friday.
    const rule = ruleWith(weeklySchedule({ interval: 2, weekdays: [5], startDate: '2026-01-02' }));
    expect(datesOf(rule, '2026-01-01', '2026-02-15')).toEqual([
      '2026-01-02',
      '2026-01-16',
      '2026-01-30',
      '2026-02-13',
    ]);
  });

  it('uses 7-day windows starting on the start date', () => {
    // Start Wednesday 2026-01-07, Mon/Wed/Fri every other week.
    const rule = ruleWith(
      weeklySchedule({ interval: 2, weekdays: [1, 3, 5], startDate: '2026-01-07' }),
    );
    expect(datesOf(rule, '2026-01-01', '2026-01-31')).toEqual([
      '2026-01-07',
      '2026-01-09',
      '2026-01-12',
      '2026-01-21',
      '2026-01-23',
      '2026-01-26',
    ]);
  });

  it('repeats every n days', () => {
    const rule = ruleWith(dailySchedule({ interval: 10, startDate: '2026-02-20' }));
    expect(datesOf(rule, '2026-02-01', '2026-03-31')).toEqual([
      '2026-02-20',
      '2026-03-02',
      '2026-03-12',
      '2026-03-22',
    ]);
  });
});

describe('expandSchedule — ranges and end conditions', () => {
  const rule = ruleWith(monthlySchedule({ dayOfMonth: 5, startDate: '2026-01-05' }));

  it('treats both range boundaries as inclusive', () => {
    expect(datesOf(rule, '2026-02-05', '2026-04-05')).toEqual([
      '2026-02-05',
      '2026-03-05',
      '2026-04-05',
    ]);
    expect(datesOf(rule, '2026-02-06', '2026-03-04')).toEqual([]);
  });

  it('starts mid-range at the start date', () => {
    expect(datesOf(rule, '2025-11-01', '2026-02-28')).toEqual(['2026-01-05', '2026-02-05']);
  });

  it('returns nothing for an inverted range or an inactive rule', () => {
    expect(expandSchedule(rule, '2026-03-01', '2026-02-01')).toEqual([]);
    expect(expandSchedule({ ...rule, active: false }, '2026-01-01', '2026-12-31')).toEqual([]);
  });

  it('stops on the end date (inclusive)', () => {
    const ending = ruleWith(
      monthlySchedule({
        dayOfMonth: 5,
        startDate: '2026-01-05',
        end: { type: 'onDate', date: '2026-03-05' },
      }),
    );
    expect(datesOf(ending, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-05',
      '2026-02-05',
      '2026-03-05',
    ]);
  });

  it('stops after a count, and skipped occurrences still count', () => {
    const counted = ruleWith(
      monthlySchedule({
        dayOfMonth: 5,
        startDate: '2026-01-05',
        end: { type: 'afterCount', count: 3 },
      }),
      { exceptions: [skipException('2026-02-05')] },
    );
    expect(datesOf(counted, '2026-01-01', '2026-12-31')).toEqual(['2026-01-05', '2026-03-05']);
  });

  it('builds occurrences from the rule', () => {
    const [first] = expandSchedule(rule, '2026-01-01', '2026-01-31');
    expect(first).toEqual({
      ruleId: rule.id,
      date: '2026-01-05',
      originalDate: '2026-01-05',
      kind: rule.kind,
      amountMinor: rule.amountMinor,
      walletId: rule.walletId,
      description: rule.description,
      posted: false,
    });
  });

  it.each([
    ['daily', dailySchedule({ startDate: '9999-12-30' }), ['9999-12-30', '9999-12-31']],
    ['weekly', weeklySchedule({ startDate: '9999-12-27', weekdays: [5, 6] }), ['9999-12-31']],
    ['monthly', monthlySchedule({ startDate: '9999-11-01' }), ['9999-11-01', '9999-12-01']],
    ['yearly', yearlySchedule({ startDate: '9998-01-01' }), ['9998-01-01', '9999-01-01']],
  ])('stops a never-ending %s rule at year 9999', (_, schedule, expected) => {
    expect([...scheduleDates(schedule)]).toEqual(expected);
  });
});

describe('expandSchedule — exceptions', () => {
  const rule = ruleWith(monthlySchedule({ dayOfMonth: 1, startDate: '2026-01-01' }), {
    amountMinor: 100_000,
  });

  it('skips an occurrence', () => {
    const skipping = { ...rule, exceptions: [skipException('2026-02-01')] };
    expect(datesOf(skipping, '2026-01-01', '2026-03-31')).toEqual(['2026-01-01', '2026-03-01']);
  });

  it('overrides the amount of one occurrence', () => {
    const overriding = {
      ...rule,
      exceptions: [overrideException('2026-02-01', { overrideAmountMinor: 120_000 })],
    };
    expect(
      expandSchedule(overriding, '2026-01-01', '2026-03-31').map((o) => o.amountMinor),
    ).toEqual([100_000, 120_000, 100_000]);
  });

  it('moves one occurrence and keeps it identified by its original date', () => {
    const moving = {
      ...rule,
      exceptions: [overrideException('2026-02-01', { overrideDate: '2026-03-15' })],
    };
    const occurrences = expandSchedule(moving, '2026-01-01', '2026-03-31');
    expect(occurrences.map((o) => [o.date, o.originalDate])).toEqual([
      ['2026-01-01', '2026-01-01'],
      ['2026-03-01', '2026-03-01'],
      ['2026-03-15', '2026-02-01'],
    ]);
  });

  it('includes occurrences moved into the range from either side', () => {
    const moving = {
      ...rule,
      exceptions: [
        overrideException('2026-01-01', { overrideDate: '2026-02-10' }),
        overrideException('2026-04-01', { overrideDate: '2026-02-20' }),
      ],
    };
    expect(datesOf(moving, '2026-02-01', '2026-02-28')).toEqual([
      '2026-02-01',
      '2026-02-10',
      '2026-02-20',
    ]);
  });

  it('excludes occurrences moved out of the range', () => {
    const moving = {
      ...rule,
      exceptions: [overrideException('2026-02-01', { overrideDate: '2026-01-31' })],
    };
    expect(datesOf(moving, '2026-02-01', '2026-02-28')).toEqual([]);
  });

  it('ignores exceptions for dates the schedule does not produce', () => {
    const stray = {
      ...rule,
      exceptions: [overrideException('2026-02-02', { overrideDate: '2026-02-15' })],
    };
    expect(datesOf(stray, '2026-02-01', '2026-02-28')).toEqual(['2026-02-01']);
  });

  it('finds moved occurrences of long-running daily and weekly rules', () => {
    // 2000-01-03 and 2026-01-05 are both Mondays, 1357 weeks apart.
    const weeklyEvery7Days = ruleWith(dailySchedule({ interval: 7, startDate: '2000-01-03' }), {
      exceptions: [overrideException('2026-01-05', { overrideDate: '2026-02-11' })],
    });
    expect(datesOf(weeklyEvery7Days, '2026-02-01', '2026-02-28')).toEqual([
      '2026-02-02',
      '2026-02-09',
      '2026-02-11',
      '2026-02-16',
      '2026-02-23',
    ]);

    const biweekly = ruleWith(
      weeklySchedule({ interval: 2, weekdays: [1], startDate: '2000-01-03' }),
      { exceptions: [overrideException('2026-01-12', { overrideDate: '2026-02-11' })] },
    );
    expect(datesOf(biweekly, '2026-02-01', '2026-02-28')).toEqual([
      '2026-02-09',
      '2026-02-11',
      '2026-02-23',
    ]);
  });
});

describe('markPosted', () => {
  const rule = ruleWith(monthlySchedule({ dayOfMonth: 1, startDate: '2026-01-01' }), {
    exceptions: [overrideException('2026-02-01', { overrideDate: '2026-02-03' })],
  });
  const occurrences = expandSchedule(rule, '2026-01-01', '2026-03-31');

  it('matches on rule id + original date, not on the effective date', () => {
    const posted = makeTransaction({
      recurringRuleId: rule.id,
      occurrenceDate: '2026-02-01',
      date: '2026-02-03',
    });
    const sameDayOtherRule = makeTransaction({
      recurringRuleId: 'another-rule',
      occurrenceDate: '2026-01-01',
      date: '2026-01-01',
    });
    const oneTime = makeTransaction({ date: '2026-03-01' });

    const marked = markPosted(occurrences, [posted, sameDayOtherRule, oneTime]);
    expect(marked.map((o) => [o.originalDate, o.posted, o.transactionId])).toEqual([
      ['2026-01-01', false, undefined],
      ['2026-02-01', true, posted.id],
      ['2026-03-01', false, undefined],
    ]);
  });

  it('clears a stale transactionId when the transaction is gone', () => {
    const [stale] = markPosted(
      occurrences.slice(0, 1).map((o) => ({ ...o, posted: true, transactionId: 'gone' })),
      [],
    );
    expect(stale).toEqual(occurrences[0]);
    expect(stale).not.toHaveProperty('transactionId');
  });
});

/* ------------------------------------------------------------------------ */
/* Property-based tests against an independent day-by-day oracle.           */
/* ------------------------------------------------------------------------ */

const MAX_DAY = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function clampedDay(year: number, month: number, dayOfMonth: DayOfMonth): number {
  const length = daysInMonth(year, month);
  return dayOfMonth === 'last' ? length : Math.min(dayOfMonth, length);
}

/** Whether `day` satisfies the schedule's pattern, judged one day at a time. */
function matches(schedule: Schedule, day: ISODate): boolean {
  const [year = 0, month = 0, date = 0] = day.split('-').map(Number);
  const [startYear = 0, startMonth = 0] = schedule.startDate.split('-').map(Number);
  const elapsed = diffInDays(day, schedule.startDate);
  switch (schedule.frequency) {
    case 'daily':
      return elapsed % schedule.interval === 0;
    case 'weekly':
      return (
        Math.floor(elapsed / 7) % schedule.interval === 0 &&
        schedule.weekdays.includes(weekdayOf(day))
      );
    case 'monthly':
      return (
        ((year - startYear) * 12 + month - startMonth) % schedule.interval === 0 &&
        date === clampedDay(year, month, schedule.dayOfMonth)
      );
    case 'yearly':
      return (
        (year - startYear) % schedule.interval === 0 &&
        month === schedule.month &&
        date === clampedDay(year, month, schedule.dayOfMonth)
      );
  }
}

function oracleDates(schedule: Schedule, until: ISODate): ISODate[] {
  const dates: ISODate[] = [];
  for (const day of eachDayInRange(schedule.startDate, until)) {
    if (!matches(schedule, day)) continue;
    if (schedule.end.type === 'onDate' && day > schedule.end.date) break;
    if (schedule.end.type === 'afterCount' && dates.length === schedule.end.count) break;
    dates.push(day);
  }
  return dates;
}

const startArb = isoDateArb(new Date('2020-01-01T00:00:00Z'), new Date('2030-12-31T00:00:00Z'));
const intervalArb = fc.integer({ min: 1, max: 6 });
const dayOfMonthArb: fc.Arbitrary<DayOfMonth> = fc.oneof(
  fc.integer({ min: 1, max: 31 }),
  fc.constant('last' as const),
);

const scheduleArb: fc.Arbitrary<Schedule> = startArb.chain((startDate) => {
  const end: fc.Arbitrary<Schedule['end']> = fc.oneof(
    fc.constant({ type: 'never' as const }),
    fc
      .integer({ min: 0, max: 900 })
      .map((n) => ({ type: 'onDate' as const, date: addDays(startDate, n) })),
    fc.integer({ min: 1, max: 25 }).map((count) => ({ type: 'afterCount' as const, count })),
  );
  return fc.oneof(
    fc.record({ interval: intervalArb, end }).map((s) => dailySchedule({ ...s, startDate })),
    fc
      .record({
        interval: intervalArb,
        end,
        weekdays: fc.uniqueArray(fc.constantFrom(0, 1, 2, 3, 4, 5, 6 as const), {
          minLength: 1,
          maxLength: 7,
        }),
      })
      .map((s) => weeklySchedule({ ...s, startDate })),
    fc
      .record({ interval: intervalArb, end, dayOfMonth: dayOfMonthArb })
      .map((s) => monthlySchedule({ ...s, startDate })),
    fc
      .record({
        interval: fc.integer({ min: 1, max: 3 }),
        end,
        month: fc.integer({ min: 1, max: 12 }),
      })
      .chain((s) =>
        fc
          .oneof(
            fc.integer({ min: 1, max: MAX_DAY[s.month - 1] ?? 28 }),
            fc.constant('last' as const),
          )
          .map((dayOfMonth) => yearlySchedule({ ...s, dayOfMonth, startDate })),
      ),
  );
});

const caseArb = scheduleArb.chain((schedule) =>
  fc
    .record({
      fromOffset: fc.integer({ min: -60, max: 700 }),
      length: fc.integer({ min: 0, max: 500 }),
    })
    .map(({ fromOffset, length }) => {
      const from = addDays(schedule.startDate, fromOffset);
      return { schedule, from, to: addDays(from, length) };
    }),
);

describe('expandSchedule — properties', () => {
  it('produces exactly the dates a day-by-day oracle finds', () => {
    fc.assert(
      fc.property(caseArb, ({ schedule, from, to }) => {
        const rule = ruleWith(schedule);
        const expected = oracleDates(schedule, to).filter((day) => day >= from);
        const occurrences = expandSchedule(rule, from, to);
        expect(occurrences.map((o) => o.date)).toEqual(expected);
        for (const occurrence of occurrences) {
          expect(occurrence.originalDate).toBe(occurrence.date);
          expect(occurrence.amountMinor).toBe(rule.amountMinor);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('is additive over adjacent ranges, even with exceptions', () => {
    fc.assert(
      fc.property(caseArb, fc.gen(), ({ schedule, from, to }, gen) => {
        const base = oracleDates(schedule, addDays(to, 60));
        const exceptions = gen(fc.subarray, base).map((date) =>
          gen(fc.boolean)
            ? skipException(date)
            : overrideException(date, {
                overrideDate: addDays(date, gen(fc.integer, { min: -45, max: 45 })),
              }),
        );
        const rule = ruleWith(schedule, { exceptions });
        const split = addDays(from, Math.floor(diffInDays(to, from) / 2));
        expect([
          ...expandSchedule(rule, from, split),
          ...expandSchedule(rule, addDays(split, 1), to),
        ]).toEqual(expandSchedule(rule, from, to));
      }),
      { numRuns: 200 },
    );
  });

  it('keeps results sorted, in range and unique per original date', () => {
    fc.assert(
      fc.property(caseArb, fc.gen(), ({ schedule, from, to }, gen) => {
        const base = oracleDates(schedule, addDays(to, 60));
        const exceptions = gen(fc.subarray, base).map((date) =>
          overrideException(date, {
            overrideDate: addDays(date, gen(fc.integer, { min: -60, max: 60 })),
            overrideAmountMinor: gen(fc.integer, { min: 1, max: 1_000_000 }),
          }),
        );
        const occurrences = expandSchedule(ruleWith(schedule, { exceptions }), from, to);
        const dates = occurrences.map((o) => o.date);
        expect(dates).toEqual([...dates].sort());
        expect(dates.every((d) => d >= from && d <= to)).toBe(true);
        const originals = occurrences.map((o) => o.originalDate);
        expect(new Set(originals).size).toBe(originals.length);
        expect(originals.every((d) => base.includes(d))).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('counts skipped occurrences towards afterCount', () => {
    fc.assert(
      fc.property(
        scheduleArb,
        fc.integer({ min: 1, max: 25 }),
        fc.gen(),
        (schedule, count, gen) => {
          const counted: Schedule = { ...schedule, end: { type: 'afterCount', count } };
          const base = [...scheduleDates(counted)];
          expect(base).toHaveLength(count);
          const skipped = gen(fc.subarray, base);
          const rule = ruleWith(counted, { exceptions: skipped.map(skipException) });
          const all = expandSchedule(rule, counted.startDate, '9999-12-31');
          expect(all).toHaveLength(count - skipped.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});
