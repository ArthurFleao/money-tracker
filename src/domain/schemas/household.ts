import { z } from 'zod';
import {
  CurrencyCodeSchema,
  IdSchema,
  ISODateTimeSchema,
  LabelSchema,
  MinorSchema,
} from './common';

/**
 * The unit of data ownership (PLAN.md §2, §4.1).
 *
 * @example
 * HouseholdSchema.parse(makeHousehold({ baseCurrency: 'BRL' }));
 */
export const HouseholdSchema = z.object({
  id: IdSchema,
  name: LabelSchema,
  baseCurrency: CurrencyCodeSchema,
  balanceFloorMinor: MinorSchema,
  weekStartsOn: z.literal([0, 1]),
  memberIds: z.array(IdSchema),
  createdAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
});

export type Household = z.infer<typeof HouseholdSchema>;
