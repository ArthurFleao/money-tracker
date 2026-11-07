import { z } from 'zod';
import {
  CurrencyCodeSchema,
  IdSchema,
  ISODateSchema,
  ISODateTimeSchema,
  KindSchema,
  LabelSchema,
  NotesSchema,
  PositiveMinorSchema,
} from './common';

/** `0` = Sunday … `6` = Saturday. */
export const WeekdaySchema = z.literal([0, 1, 2, 3, 4, 5, 6]);

/** Day of the month, or `'last'`. Days past the end of a short month clamp to its last day. */
export const DayOfMonthSchema = z.union([z.int().min(1).max(31), z.literal('last')]);

/** How a schedule stops: never, after a date (inclusive) or after a number of occurrences. */
export const ScheduleEndSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('never') }),
  z.object({ type: z.literal('onDate'), date: ISODateSchema }),
  z.object({ type: z.literal('afterCount'), count: z.int().positive() }),
]);

const scheduleBase = {
  /** Every `interval` days/weeks/months/years, aligned to `startDate`. `2` + weekly = biweekly. */
  interval: z.int().positive(),
  startDate: ISODateSchema,
  end: ScheduleEndSchema,
};

const MAX_DAY_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const DailyScheduleSchema = z.object({ frequency: z.literal('daily'), ...scheduleBase });

const WeeklyScheduleSchema = z.object({
  frequency: z.literal('weekly'),
  ...scheduleBase,
  weekdays: z
    .array(WeekdaySchema)
    .min(1)
    .refine((days) => new Set(days).size === days.length, { message: 'Weekdays must be unique' }),
});

const MonthlyScheduleSchema = z.object({
  frequency: z.literal('monthly'),
  ...scheduleBase,
  dayOfMonth: DayOfMonthSchema,
});

const YearlyScheduleSchema = z
  .object({
    frequency: z.literal('yearly'),
    ...scheduleBase,
    month: z.int().min(1).max(12),
    dayOfMonth: DayOfMonthSchema,
  })
  // Feb 29 is allowed (it clamps to Feb 28 in common years); Apr 31 is not a date at all.
  // Zod 4 runs this even when `month` is out of range, so the lookup must be total.
  .refine((s) => s.dayOfMonth === 'last' || s.dayOfMonth <= (MAX_DAY_IN_MONTH[s.month - 1] ?? 31), {
    path: ['dayOfMonth'],
    message: 'That day does not exist in the chosen month',
  });

/**
 * When a recurring rule happens (PLAN.md §4.1).
 *
 * @example
 * ScheduleSchema.parse({
 *   frequency: 'monthly', interval: 1, dayOfMonth: 'last',
 *   startDate: '2026-01-31', end: { type: 'never' },
 * });
 */
export const ScheduleSchema = z
  .discriminatedUnion('frequency', [
    DailyScheduleSchema,
    WeeklyScheduleSchema,
    MonthlyScheduleSchema,
    YearlyScheduleSchema,
  ])
  .refine((s) => s.end.type !== 'onDate' || s.end.date >= s.startDate, {
    path: ['end', 'date'],
    message: 'The end date must be on or after the start date',
  });

/**
 * A per-date override of a recurring rule, keyed by the original occurrence
 * date: skip it, or change its amount and/or move it.
 *
 * @example
 * RecurrenceExceptionSchema.parse({ date: '2026-03-05', action: 'override', overrideAmountMinor: 12_000 });
 */
export const RecurrenceExceptionSchema = z
  .object({
    date: ISODateSchema,
    action: z.enum(['skip', 'override']),
    overrideAmountMinor: PositiveMinorSchema.optional(),
    overrideDate: ISODateSchema.optional(),
  })
  .refine(
    (e) =>
      e.action === 'skip'
        ? e.overrideAmountMinor === undefined && e.overrideDate === undefined
        : e.overrideAmountMinor !== undefined || e.overrideDate !== undefined,
    { message: 'A skip has no overrides; an override changes the amount and/or the date' },
  );

/**
 * A template that generates occurrences on a schedule (PLAN.md §2, §4.1).
 *
 * @example
 * RecurringRuleSchema.parse(makeRecurringRule({ description: 'Rent', kind: 'expense' }));
 */
export const RecurringRuleSchema = z
  .object({
    id: IdSchema,
    householdId: IdSchema,
    walletId: IdSchema,
    kind: KindSchema,
    amountMinor: PositiveMinorSchema,
    currency: CurrencyCodeSchema,
    description: LabelSchema,
    notes: NotesSchema.optional(),
    schedule: ScheduleSchema,
    autoPost: z.boolean(),
    exceptions: z.array(RecurrenceExceptionSchema),
    active: z.boolean(),
    categoryId: IdSchema.optional(),
    createdAt: ISODateTimeSchema,
    updatedAt: ISODateTimeSchema,
  })
  .refine((r) => new Set(r.exceptions.map((e) => e.date)).size === r.exceptions.length, {
    path: ['exceptions'],
    message: 'At most one exception per occurrence date',
  });

export type DayOfMonth = z.infer<typeof DayOfMonthSchema>;
export type ScheduleEnd = z.infer<typeof ScheduleEndSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Frequency = Schedule['frequency'];
export type RecurrenceException = z.infer<typeof RecurrenceExceptionSchema>;
export type RecurringRule = z.infer<typeof RecurringRuleSchema>;
