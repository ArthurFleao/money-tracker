import { z } from 'zod';
import {
  CurrencyCodeSchema,
  IdSchema,
  ISODateSchema,
  ISODateTimeSchema,
  LabelSchema,
  MinorSchema,
} from './common';

export const WALLET_TYPES = [
  'cash',
  'checking',
  'savings',
  'credit',
  'investment',
  'other',
] as const;

/** Wallet palette — names match the `--color-wallet-*` tokens in `src/styles/index.css`. */
export const WALLET_COLORS = [
  'violet',
  'indigo',
  'sky',
  'cyan',
  'teal',
  'emerald',
  'lime',
  'amber',
  'orange',
  'rose',
] as const;

/**
 * A place where money is held. `initialBalanceMinor` is the balance at the
 * start of `initialBalanceDate`; a `credit` wallet that is owed money has a
 * negative balance (PLAN.md §15 default).
 *
 * @example
 * WalletSchema.parse(makeWallet({ type: 'savings', initialBalanceMinor: 50_000 }));
 */
export const WalletSchema = z.object({
  id: IdSchema,
  householdId: IdSchema,
  name: LabelSchema,
  type: z.enum(WALLET_TYPES),
  currency: CurrencyCodeSchema,
  initialBalanceMinor: MinorSchema,
  initialBalanceDate: ISODateSchema,
  color: z.enum(WALLET_COLORS),
  icon: z.string().min(1),
  archived: z.boolean(),
  sortOrder: z.int(),
  createdAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
});

export type Wallet = z.infer<typeof WalletSchema>;
export type WalletType = Wallet['type'];
export type WalletColor = Wallet['color'];
