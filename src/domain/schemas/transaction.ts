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

/**
 * A single dated movement of money in or out of a wallet. `amountMinor` is
 * always positive; `kind` gives the sign. When posted from a recurring rule it
 * carries both `recurringRuleId` and `occurrenceDate` (the rule date it came
 * from — `date` may differ if the user moved it).
 *
 * @example
 * TransactionSchema.parse(makeTransaction({ kind: 'expense', amountMinor: 4_990 }));
 */
export const TransactionSchema = z
  .object({
    id: IdSchema,
    householdId: IdSchema,
    walletId: IdSchema,
    kind: KindSchema,
    amountMinor: PositiveMinorSchema,
    currency: CurrencyCodeSchema,
    date: ISODateSchema,
    description: LabelSchema,
    notes: NotesSchema.optional(),
    status: z.enum(['pending', 'cleared']),
    recurringRuleId: IdSchema.optional(),
    occurrenceDate: ISODateSchema.optional(),
    categoryId: IdSchema.optional(),
    tagIds: z.array(IdSchema).optional(),
    createdBy: IdSchema.optional(),
    createdAt: ISODateTimeSchema,
    updatedAt: ISODateTimeSchema,
  })
  .refine((t) => (t.recurringRuleId === undefined) === (t.occurrenceDate === undefined), {
    path: ['occurrenceDate'],
    message: 'recurringRuleId and occurrenceDate must be set together',
  });

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionStatus = Transaction['status'];
